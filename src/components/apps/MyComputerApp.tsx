import React, { useState } from 'react';
import { FileItem } from '../../types';
import { playMouseClick, playHddSeek } from '../../utils/audio';
import { ArrowLeft, ArrowUp, Folder, HardDrive, CheckCircle2 } from 'lucide-react';
import { VlcConeIcon } from './vlc/VlcConeIcon';

interface MyComputerAppProps {
  onOpenFile: (file: FileItem) => void;
}

const INITIAL_FILE_SYSTEM: FileItem[] = [
  {
    id: 'c_drive',
    name: 'Local Disk (C:)',
    type: 'folder',
    subItems: [
      {
        id: 'my_docs',
        name: 'My Documents',
        type: 'folder',
        subItems: [
          {
            id: 'sticky_editor_app',
            name: 'Sticky_Notes_Editor.exe',
            type: 'exe',
            size: '84 KB',
            modified: '08/15/2004',
          },
          {
            id: 'gta_cheats',
            name: 'GTA_Vice_City_Cheats.txt',
            type: 'txt',
            size: '2 KB',
            modified: '08/12/2004',
            content: `=========================================
GTA VICE CITY PC CHEATS (CABIN 04 ARCHIVE)
=========================================

HEALTH & ARMOR:
- ASPIRINE : Full Health
- PRECIOUSPROTECTION : Full Body Armor

WEAPONS:
- THUGSTOOLS : Thug Weapons (Brass knuckles, baseball bat, 9mm, shotgun)
- PROFESSIONALTOOLS : Professional Weapons (Katana, revolver, M4, sniper)
- NUTTERTOOLS : Heavy Military Weapons (Minigun, rocket launcher, grenades)

VEHICLES:
- PANZER : Spawn Rhino Military Tank
- GETTHEREFAST : Spawn Sabre Turbo
- THELASTRIDE : Spawn Romero's Hearse
- ROCKANDROLLCAR : Spawn Love Fist Limo

WEATHER & TIME:
- LIFEISPASSINGBY : Speed up clock
- APLEASANTDAY : Nice clear weather
- CATSANDDOGS : Heavy rainy weather

NOTE: Do not save game after using cheat codes!`,
          },
          {
            id: 'homework',
            name: 'homework_final2.doc',
            type: 'doc',
            size: '18 KB',
            modified: '08/14/2004',
            content: `ESSAY TITLE: The Impact of High-Speed Broadband Internet in 2004
STUDENT: Cabin 04 Guest
CLASS: US History / Modern Technology

With the decline of 56k dial-up modems and the proliferation of DSL and cable internet, cyber cafés and LAN centers have become the modern town squares of youth culture. Real-time peer-to-peer applications such as Gnutella and instant messaging platforms connect millions around the world instantly.`,
          },
          {
            id: 'passwords',
            name: 'passwords_DO_NOT_SHARE.txt',
            type: 'txt',
            size: '1 KB',
            modified: '08/02/2004',
            content: `AIM: **********
RuneScape: dragon_slayer_04
Neopets: kougra_fan
Hotmail: ilovemyspace2004`,
          },
          {
            id: 'myspace_layout',
            name: 'myspace_layout_glitter.html',
            type: 'html',
            size: '4 KB',
            modified: '08/10/2004',
            content: `<style>
body { background: #000000 url('glitter_stars.gif'); color: #ff00ff; }
table, td { border: 1px dashed #00ffff; }
.top8 { font-family: 'Comic Sans MS'; color: #ffff00; }
</style>
<center><h1>★ WELCOME TO MY CYBER SPACE ★</h1></center>`,
          },
        ],
      },
      {
        id: 'my_pictures',
        name: 'My Pictures',
        type: 'folder',
        subItems: [
          {
            id: 'summer_2004',
            name: 'summer2004_skatepark.jpg',
            type: 'jpg',
            size: '240 KB',
            modified: '07/28/2004',
            content:
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23223344"/><circle cx="200" cy="120" r="50" fill="%23e0a060"/><path d="M120 280 Q200 190 280 280" stroke="%23ff6600" stroke-width="8" fill="none"/><text x="200" y="270" fill="white" font-family="monospace" font-size="14" text-anchor="middle">AUSTIN SKATEPARK - JULY 2004</text></svg>',
          },
        ],
      },
      {
        id: 'downloads_folder',
        name: 'Downloads',
        type: 'folder',
        subItems: [
          {
            id: 'bunny_video',
            name: 'CyberCafe_Intro_2004.mp4',
            type: 'mp4',
            size: '1.1 MB',
            modified: '08/15/2004',
            content: '/samples/cyber_cafe_sample.mp4',
          },
          {
            id: 'vlc_installer',
            name: 'vlc-0.8.6-win32.exe',
            type: 'exe',
            size: '8.4 MB',
            modified: '08/14/2004',
          },
          {
            id: 'numb_mp3',
            name: 'Linkin_Park_Numb.mp3',
            type: 'mp3',
            size: '3.4 MB',
            modified: '08/15/2004',
          },
          {
            id: 'cs_patch',
            name: 'CS16_patch.exe',
            type: 'exe',
            size: '24.1 MB',
            modified: '08/15/2004',
          },
        ],
      },
      {
        id: 'games_folder',
        name: 'Games',
        type: 'folder',
        subItems: [
          { id: 'cs_game', name: 'Counter-Strike 1.6', type: 'exe', size: '380 MB' },
          { id: 'minesweeper_game', name: 'Minesweeper.exe', type: 'exe', size: '120 KB' },
        ],
      },
    ],
  },
];

export const MyComputerApp: React.FC<MyComputerAppProps> = ({ onOpenFile }) => {
  const [fileSystem, setFileSystem] = useState<FileItem[]>(INITIAL_FILE_SYSTEM);
  const [currentPathIds, setCurrentPathIds] = useState<string[]>(['c_drive', 'my_docs']);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Helper: traverse tree to find folder by path
  const findFolderByPath = (tree: FileItem[], path: string[]): FileItem | null => {
    if (path.length === 0) return null;
    let current: FileItem | undefined = tree.find((item) => item.id === path[0]);
    for (let i = 1; i < path.length; i++) {
      if (!current || !current.subItems) return null;
      current = current.subItems.find((item) => item.id === path[i]);
    }
    return current || null;
  };

  // Helper: find any item recursively by ID
  const findItemById = (tree: FileItem[], id: string): FileItem | null => {
    for (const item of tree) {
      if (item.id === id) return item;
      if (item.subItems) {
        const found = findItemById(item.subItems, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper: remove item from entire tree recursively
  const removeItemFromTree = (tree: FileItem[], id: string): { newTree: FileItem[]; removedItem: FileItem | null } => {
    let removedItem: FileItem | null = null;

    const traverse = (items: FileItem[]): FileItem[] => {
      const filtered: FileItem[] = [];
      for (const it of items) {
        if (it.id === id) {
          removedItem = it;
        } else {
          if (it.subItems) {
            filtered.push({
              ...it,
              subItems: traverse(it.subItems),
            });
          } else {
            filtered.push(it);
          }
        }
      }
      return filtered;
    };

    const newTree = traverse(tree);
    return { newTree, removedItem };
  };

  // Helper: insert item into specific folder in tree
  const insertItemIntoFolder = (tree: FileItem[], targetFolderId: string, itemToInsert: FileItem): FileItem[] => {
    return tree.map((it) => {
      if (it.id === targetFolderId) {
        return {
          ...it,
          subItems: [...(it.subItems || []), itemToInsert],
        };
      }
      if (it.subItems) {
        return {
          ...it,
          subItems: insertItemIntoFolder(it.subItems, targetFolderId, itemToInsert),
        };
      }
      return it;
    });
  };

  // Move file using HTML5 Drag and Drop API
  const handleMoveFile = (fileId: string, targetFolderId: string) => {
    if (fileId === targetFolderId) return;

    // Check if target is a valid folder
    const targetFolder = findItemById(fileSystem, targetFolderId);
    if (!targetFolder || targetFolder.type !== 'folder') return;

    const sourceItem = findItemById(fileSystem, fileId);
    if (!sourceItem) return;

    playHddSeek();

    const { newTree, removedItem } = removeItemFromTree(fileSystem, fileId);
    if (removedItem) {
      const updatedTree = insertItemIntoFolder(newTree, targetFolderId, removedItem);
      setFileSystem(updatedTree);
      setStatusMessage(`Moved "${removedItem.name}" to "${targetFolder.name}"`);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  const currentFolder = findFolderByPath(fileSystem, currentPathIds);
  const currentItems = currentFolder?.subItems || [];

  // Breadcrumb path names
  const breadcrumbs = currentPathIds.map((id) => {
    const item = findItemById(fileSystem, id);
    return item ? item.name : id;
  });

  const navigateInto = (item: FileItem) => {
    if (item.type === 'folder') {
      playMouseClick();
      playHddSeek();
      setCurrentPathIds([...currentPathIds, item.id]);
      setSelectedItemId(null);
    }
  };

  const navigateUp = () => {
    if (currentPathIds.length > 1) {
      playMouseClick();
      playHddSeek();
      setCurrentPathIds(currentPathIds.slice(0, -1));
      setSelectedItemId(null);
    }
  };

  const navigateToRoot = () => {
    playMouseClick();
    playHddSeek();
    setCurrentPathIds(['c_drive']);
    setSelectedItemId(null);
  };

  const navigateToFolderId = (folderId: string) => {
    playMouseClick();
    playHddSeek();
    if (folderId === 'c_drive') {
      setCurrentPathIds(['c_drive']);
    } else {
      setCurrentPathIds(['c_drive', folderId]);
    }
    setSelectedItemId(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#ece9d8] text-[#111] font-tahoma text-[11px] select-text">
      {/* Explorer Menu bar */}
      <div className="bg-[#ece9d8] px-2 py-0.5 border-b border-[#d4d0c8] flex items-center gap-3 text-[11px] select-none">
        <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-pointer">File</span>
        <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-pointer">Edit</span>
        <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-pointer">View</span>
        <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-pointer">Tools</span>
        <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-pointer">Help</span>
      </div>

      {/* Explorer Navigation Toolbar */}
      <div className="bg-[#ece9d8] px-2 py-1 border-b border-[#d4d0c8] flex items-center gap-1.5 select-none">
        <button
          type="button"
          onClick={navigateUp}
          disabled={currentPathIds.length <= 1}
          className="flex items-center gap-1 px-2 py-0.5 border border-transparent hover:border-gray-400 disabled:opacity-40 cursor-pointer rounded-xs"
        >
          <ArrowLeft size={13} className="text-green-700" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={navigateUp}
          disabled={currentPathIds.length <= 1}
          className="flex items-center gap-1 px-2 py-0.5 border border-transparent hover:border-gray-400 disabled:opacity-40 cursor-pointer rounded-xs"
        >
          <ArrowUp size={13} className="text-green-700" />
          <span>Up</span>
        </button>

        <span className="h-4 border-r border-gray-300 mx-1" />

        {/* Breadcrumb address bar with drop support */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => {
            e.preventDefault();
            const fileId = e.dataTransfer.getData('text/plain') || draggedItemId;
            if (fileId && currentPathIds.length > 1) {
              const parentFolderId = currentPathIds[currentPathIds.length - 2];
              handleMoveFile(fileId, parentFolderId);
            }
          }}
          className="flex-1 bg-white border border-[#7f9db9] px-2 py-0.5 flex items-center gap-1.5 text-gray-700 font-mono text-[10.5px] truncate"
        >
          <span className="text-gray-500 font-bold select-none">Address:</span>
          <span>C:\ {breadcrumbs.slice(1).join(' \ ')}</span>
        </div>
      </div>

      {/* Main Split View: Left Sidebar & Right Grid View */}
      <div className="flex-1 flex overflow-hidden bg-white">
        {/* Left Windows XP Tasks & Folder Tree Panel with HTML5 Drop Targets */}
        <div className="w-[185px] bg-gradient-to-b from-[#7aa1e6] to-[#6375d6] p-2 text-white flex flex-col gap-2.5 select-none shrink-0 border-r border-[#7f9db9] overflow-y-auto">
          {/* System Quick Places Box (Drop Targets) */}
          <div className="bg-white/95 text-[#002266] rounded-t-xs overflow-hidden border border-white shadow-xs">
            <div className="bg-[#d4e4f8] px-2 py-1 font-bold text-[11px] border-b border-[#b0c8e8] flex justify-between">
              <span>Folder Drop Targets</span>
            </div>
            <div className="p-1.5 space-y-1 text-[10.5px]">
              {[
                { id: 'my_docs', name: 'My Documents', icon: '📁' },
                { id: 'my_pictures', name: 'My Pictures', icon: '🖼️' },
                { id: 'downloads_folder', name: 'Downloads', icon: '📥' },
                { id: 'games_folder', name: 'Games', icon: '🎮' },
                { id: 'c_drive', name: 'Local Disk (C:)', icon: '💾' },
              ].map((folder) => {
                const isOver = dragOverFolderId === folder.id;
                const isCurrent = currentPathIds[currentPathIds.length - 1] === folder.id;
                return (
                  <div
                    key={folder.id}
                    onClick={() => navigateToFolderId(folder.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDragEnter={() => setDragOverFolderId(folder.id)}
                    onDragLeave={() => setDragOverFolderId(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverFolderId(null);
                      const fileId = e.dataTransfer.getData('text/plain') || draggedItemId;
                      if (fileId) {
                        handleMoveFile(fileId, folder.id);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-1.5 py-1 rounded-xs cursor-pointer transition-all ${
                      isOver
                        ? 'bg-[#316ac5] text-white ring-2 ring-blue-400 font-bold'
                        : isCurrent
                        ? 'bg-[#d8e6f8] text-[#002266] font-bold'
                        : 'text-blue-700 hover:bg-[#eef4fc]'
                    }`}
                  >
                    <span>{folder.icon}</span>
                    <span className="truncate">{folder.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* XP Drag & Drop Guide Box */}
          <div className="bg-white/95 text-[#002266] rounded-t-xs overflow-hidden border border-white shadow-xs p-2 text-[10px] space-y-1">
            <div className="font-bold text-[#003399] flex items-center gap-1">
              <span>💡 Drag & Drop Enabled</span>
            </div>
            <p className="text-gray-600 leading-tight">
              Drag any file into a folder in the grid or drop it onto any folder in the left sidebar to move it.
            </p>
          </div>
        </div>

        {/* Right Files View Grid */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          className="flex-1 p-3 overflow-y-auto bg-white select-none relative"
        >
          {currentItems.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-[11.5px] p-6 text-center">
              <Folder size={36} className="text-gray-300 mb-1" />
              <span>This folder is empty.</span>
              <span className="text-[10px] text-gray-400 mt-1">Drag files here to place them inside this folder.</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {currentItems.map((item) => {
                const isSelected = selectedItemId === item.id;
                const isFolder = item.type === 'folder';
                const isDropTargetOver = dragOverFolderId === item.id;

                return (
                  <div
                    key={item.id}
                    draggable={!isFolder}
                    onDragStart={(e) => {
                      setDraggedItemId(item.id);
                      e.dataTransfer.setData('text/plain', item.id);
                      e.dataTransfer.effectAllowed = 'move';
                      playMouseClick();
                    }}
                    onDragEnd={() => {
                      setDraggedItemId(null);
                      setDragOverFolderId(null);
                    }}
                    onDragOver={(e) => {
                      if (isFolder) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }
                    }}
                    onDragEnter={() => {
                      if (isFolder && draggedItemId !== item.id) {
                        setDragOverFolderId(item.id);
                      }
                    }}
                    onDragLeave={() => {
                      if (isFolder && dragOverFolderId === item.id) {
                        setDragOverFolderId(null);
                      }
                    }}
                    onDrop={(e) => {
                      if (isFolder) {
                        e.preventDefault();
                        setDragOverFolderId(null);
                        const fileId = e.dataTransfer.getData('text/plain') || draggedItemId;
                        if (fileId && fileId !== item.id) {
                          handleMoveFile(fileId, item.id);
                        }
                      }
                    }}
                    onClick={() => {
                      playMouseClick();
                      setSelectedItemId(item.id);
                    }}
                    onDoubleClick={() => {
                      if (isFolder) {
                        navigateInto(item);
                      } else {
                        onOpenFile(item);
                      }
                    }}
                    className={`flex flex-col items-center p-2 rounded-xs cursor-pointer border transition-colors ${
                      isDropTargetOver
                        ? 'bg-[#316ac5]/20 border-2 border-dashed border-[#0055ea] shadow-md scale-105'
                        : isSelected
                        ? 'bg-[#316ac5]/20 border-[#316ac5] text-[#002266]'
                        : 'border-transparent hover:bg-[#eef2f8]'
                    }`}
                  >
                    {/* Item Type Icon */}
                    <div className="text-3xl mb-1 select-none flex items-center justify-center h-9">
                      {item.type === 'folder' && (isDropTargetOver ? '📂' : '📁')}
                      {item.type === 'txt' && '📄'}
                      {item.type === 'doc' && '📝'}
                      {item.type === 'jpg' && '🖼️'}
                      {item.type === 'mp3' && '🎵'}
                      {(item.type === 'mp4' || item.type === 'avi' || item.type === 'wmv') && (
                        <div className="flex items-center justify-center">
                          <VlcConeIcon size={30} />
                        </div>
                      )}
                      {item.type === 'exe' && (
                        item.id.includes('vlc') ? (
                          <div className="flex items-center justify-center">
                            <VlcConeIcon size={30} />
                          </div>
                        ) : '🎮'
                      )}
                      {item.type === 'html' && '🌐'}
                    </div>

                    <div className="text-[11px] text-center font-tahoma break-words line-clamp-2 leading-tight">
                      {item.name}
                    </div>

                    {item.size && (
                      <div className="text-[9px] text-gray-500 font-mono mt-0.5">{item.size}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-[#ece9d8] border-t border-[#d4d0c8] px-2 py-0.5 flex justify-between text-[10px] text-gray-600 font-tahoma select-none">
        <div className="flex items-center gap-2">
          <span>{currentItems.length} objects</span>
          {statusMessage && (
            <span className="text-[#0055ea] font-semibold flex items-center gap-1">
              <CheckCircle2 size={11} /> {statusMessage}
            </span>
          )}
        </div>
        <span>Local intranet · HTML5 Drag & Drop</span>
      </div>
    </div>
  );
};
