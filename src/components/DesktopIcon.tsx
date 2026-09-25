import React from 'react';
import { playMouseClick } from '../utils/audio';

interface DesktopIconProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  id,
  title,
  icon,
  isSelected,
  onClick,
  onDoubleClick,
}) => {
  return (
    <div
      id={`desktop-icon-${id}`}
      onClick={onClick}
      onDoubleClick={() => {
        playMouseClick();
        onDoubleClick();
      }}
      className={`w-20 p-1 flex flex-col items-center justify-center cursor-pointer rounded-xs select-none transition-colors group ${
        isSelected
          ? 'bg-[#316ac5]/70 border border-[#316ac5] text-white shadow-xs'
          : 'hover:bg-white/10 border border-transparent text-white'
      }`}
    >
      <div className="text-3xl mb-1 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <span
        className="text-[11px] font-tahoma text-center leading-tight break-words px-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
        style={{
          textShadow: '1px 1px 2px #000000, -1px -1px 2px #000000',
        }}
      >
        {title}
      </span>
    </div>
  );
};
