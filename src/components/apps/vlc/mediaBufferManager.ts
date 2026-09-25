/**
 * MediaBufferManager
 * 
 * Provides high-performance in-memory Blob Object URL caching and MediaSource API streaming.
 * Allows instant, zero-latency 20+ second scrubbing/seeking without network re-fetching,
 * eliminating browser abort errors and "could not open media" failures during scrub operations.
 */

interface BufferProgressCallback {
  (progressPercent: number, bufferedBytes: number, totalBytes: number): void;
}

class MediaBufferManager {
  private blobUrlCache: Map<string, string> = new Map();
  private blobDataCache: Map<string, Blob> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();
  private pendingPromises: Map<string, Promise<string>> = new Map();

  /**
   * Check if a URL is already converted to a Blob Object URL
   */
  public hasCachedBlob(url: string): boolean {
    return this.blobUrlCache.has(url) || url.startsWith('blob:');
  }

  /**
   * Get cached Blob URL if available
   */
  public getCachedBlobUrl(url: string): string | null {
    if (url.startsWith('blob:')) return url;
    return this.blobUrlCache.get(url) || null;
  }

  /**
   * Detect suitable MIME type for media URL or file
   */
  public detectMimeType(url: string, declaredMime?: string): string {
    if (declaredMime) return declaredMime;
    const cleanUrl = url.toLowerCase().split('?')[0];
    if (cleanUrl.endsWith('.mp4')) return 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
    if (cleanUrl.endsWith('.webm')) return 'video/webm; codecs="vp8, vorbis"';
    if (cleanUrl.endsWith('.mp3')) return 'audio/mpeg';
    if (cleanUrl.endsWith('.ogg') || cleanUrl.endsWith('.oga')) return 'audio/ogg';
    if (cleanUrl.endsWith('.wav')) return 'audio/wav';
    if (cleanUrl.endsWith('.m4a') || cleanUrl.endsWith('.aac')) return 'audio/mp4';
    return 'video/mp4';
  }

  /**
   * Fetch and wrap media stream into an in-memory Blob Object URL.
   * This caches the media in browser memory so scrubbing 20s+ forward/backward
   * is 100% instantaneous with zero network overhead and no HTTP Range errors.
   */
  public async loadAsBlobUrl(
    url: string,
    mimeType?: string,
    onProgress?: BufferProgressCallback
  ): Promise<string> {
    if (!url) return '';
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }

    // Return existing cached Object URL
    if (this.blobUrlCache.has(url)) {
      return this.blobUrlCache.get(url)!;
    }

    // Return in-flight promise if already loading
    if (this.pendingPromises.has(url)) {
      return this.pendingPromises.get(url)!;
    }

    // Abort any prior fetch for this specific URL
    this.abortLoading(url);
    const controller = new AbortController();
    this.abortControllers.set(url, controller);

    const loadPromise = (async () => {
      try {
        const fetchUrl = url;
        const response = await fetch(fetchUrl, {
          signal: controller.signal,
          headers: {
            Accept: '*/*',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP fetch error ${response.status}: ${response.statusText}`);
        }

        const totalBytes = parseInt(response.headers.get('content-length') || '0', 10);
        const resolvedMime =
          response.headers.get('content-type') || this.detectMimeType(url, mimeType);

        if (!response.body) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(
            new Blob([blob], { type: resolvedMime || 'video/mp4' })
          );
          this.blobUrlCache.set(url, objectUrl);
          this.blobDataCache.set(url, blob);
          if (onProgress) onProgress(100, blob.size, blob.size);
          return objectUrl;
        }

        // Stream reader for progressive memory buffering
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let receivedBytes = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            receivedBytes += value.length;
            if (onProgress && totalBytes > 0) {
              const pct = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
              onProgress(pct, receivedBytes, totalBytes);
            }
          }
        }

        const fullBlob = new Blob(chunks, { type: resolvedMime || 'video/mp4' });
        const blobUrl = URL.createObjectURL(fullBlob);

        this.blobUrlCache.set(url, blobUrl);
        this.blobDataCache.set(url, fullBlob);

        if (onProgress) {
          onProgress(100, receivedBytes, receivedBytes);
        }

        return blobUrl;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return url;
        }
        // If fetch failed (e.g. CORS on third-party site), return raw URL for native playback
        return url;
      } finally {
        this.pendingPromises.delete(url);
        this.abortControllers.delete(url);
      }
    })();

    this.pendingPromises.set(url, loadPromise);
    return loadPromise;
  }

  /**
   * Try creating a MediaSource stream wrapper where supported by the browser engine
   */
  public createMediaSourceStream(
    url: string,
    mimeType: string,
    onError?: (err: Error) => void
  ): { objectUrl: string; cleanup: () => void } | null {
    if (
      typeof window === 'undefined' ||
      !window.MediaSource ||
      !MediaSource.isTypeSupported(mimeType)
    ) {
      return null;
    }

    try {
      const mediaSource = new MediaSource();
      const objectUrl = URL.createObjectURL(mediaSource);
      let isCleanedUp = false;
      const controller = new AbortController();

      const onSourceOpen = async () => {
        if (isCleanedUp) return;
        try {
          const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
          sourceBuffer.mode = 'segments';

          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok || !response.body) {
            if (mediaSource.readyState === 'open') {
              mediaSource.endOfStream();
            }
            return;
          }

          const reader = response.body.getReader();

          const pushNextChunk = async () => {
            if (isCleanedUp) return;
            try {
              const { done, value } = await reader.read();
              if (done) {
                if (mediaSource.readyState === 'open') {
                  mediaSource.endOfStream();
                }
                return;
              }
              if (value && mediaSource.readyState === 'open') {
                if (!sourceBuffer.updating) {
                  sourceBuffer.appendBuffer(value);
                  sourceBuffer.addEventListener('updateend', pushNextChunk, { once: true });
                } else {
                  sourceBuffer.addEventListener(
                    'updateend',
                    () => {
                      if (!isCleanedUp && mediaSource.readyState === 'open') {
                        sourceBuffer.appendBuffer(value);
                        sourceBuffer.addEventListener('updateend', pushNextChunk, { once: true });
                      }
                    },
                    { once: true }
                  );
                }
              }
            } catch (readErr: any) {
              if (readErr?.name !== 'AbortError' && onError) {
                onError(readErr);
              }
            }
          };

          pushNextChunk();
        } catch (err: any) {
          if (onError && err?.name !== 'AbortError') {
            onError(err);
          }
        }
      };

      mediaSource.addEventListener('sourceopen', onSourceOpen, { once: true });

      const cleanup = () => {
        isCleanedUp = true;
        controller.abort();
        try {
          if (mediaSource.readyState === 'open') {
            mediaSource.endOfStream();
          }
        } catch {
          // ignore
        }
        URL.revokeObjectURL(objectUrl);
      };

      return { objectUrl, cleanup };
    } catch {
      return null;
    }
  }

  /**
   * Cancel ongoing memory buffer loading for a URL
   */
  public abortLoading(url: string) {
    const controller = this.abortControllers.get(url);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(url);
    }
  }

  /**
   * Release cached Blob Object URLs from browser memory
   */
  public revokeUrl(url: string) {
    const blobUrl = this.blobUrlCache.get(url);
    if (blobUrl && blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
    }
    this.blobUrlCache.delete(url);
    this.blobDataCache.delete(url);
  }

  /**
   * Clean up all cached object URLs on unmount
   */
  public revokeAll() {
    this.abortControllers.forEach((ctrl) => ctrl.abort());
    this.abortControllers.clear();
    this.pendingPromises.clear();

    this.blobUrlCache.forEach((blobUrl) => {
      if (blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    });
    this.blobUrlCache.clear();
    this.blobDataCache.clear();
  }
}

export const mediaBufferManager = new MediaBufferManager();
