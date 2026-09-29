import React from 'react';

interface CrtEffectsProps {
  isDegaussing: boolean;
  scanlinesEnabled?: boolean;
}

export const CrtEffects: React.FC<CrtEffectsProps> = ({ isDegaussing, scanlinesEnabled = true }) => {
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[2] w-full h-full overflow-hidden transition-all duration-300 ${
        isDegaussing ? 'animate-degauss' : ''
      }`}
      aria-hidden="true"
    >
      {/* 1. Subtle CRT Scanlines */}
      {scanlinesEnabled && (
        <div
          className="absolute inset-0 w-full h-full opacity-35"
          style={{
            backgroundImage:
              'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
            backgroundSize: '100% 3px, 3px 100%',
          }}
        />
      )}

      {/* 2. CRT Vignette & Glass Curvature Gradient */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'radial-gradient(circle at center, transparent 65%, rgba(0, 0, 0, 0.42) 100%)',
          boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.6)',
        }}
      />

      {/* 3. Subtle Phosphor Glow & Reflection */}
      <div
        className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 40%, transparent 100%)',
        }}
      />
    </div>
  );
};
