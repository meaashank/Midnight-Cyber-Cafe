// Authentic VLC Cone SVG Icon Component
import React from 'react';

interface VlcConeIconProps {
  className?: string;
  size?: number;
}

export const VlcConeIcon: React.FC<VlcConeIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none drop-shadow-xs ${className}`}
    >
      <defs>
        {/* Base shadow */}
        <radialGradient id="coneShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        {/* Cone Orange Gradient */}
        <linearGradient id="vlcOrange" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff5500" />
          <stop offset="35%" stopColor="#ff8811" />
          <stop offset="70%" stopColor="#ff7700" />
          <stop offset="100%" stopColor="#d64000" />
        </linearGradient>
        {/* White Strip Gradient */}
        <linearGradient id="vlcWhite" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e0e0e0" />
          <stop offset="40%" stopColor="#ffffff" />
          <stop offset="75%" stopColor="#f0f0f0" />
          <stop offset="100%" stopColor="#c5c5c5" />
        </linearGradient>
        {/* Cone Tip highlight */}
        <linearGradient id="vlcTip" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff8822" />
          <stop offset="50%" stopColor="#ffa044" />
          <stop offset="100%" stopColor="#d94e00" />
        </linearGradient>
        {/* Base Plate Gradient */}
        <linearGradient id="vlcBasePlate" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff8c1a" />
          <stop offset="30%" stopColor="#e8590c" />
          <stop offset="70%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx="24" cy="43.5" rx="19" ry="3.5" fill="url(#coneShadow)" />

      {/* Hexagonal / Rounded Base Plate */}
      <path
        d="M6 39.5 L14 43.5 L34 43.5 L42 39.5 L34 37 L14 37 Z"
        fill="url(#vlcBasePlate)"
        stroke="#9a3412"
        strokeWidth="0.8"
      />
      {/* Base Bevel */}
      <path
        d="M6 39.5 L14 43.5 L34 43.5 L42 39.5 L40 41 L34 44.5 L14 44.5 L8 41 Z"
        fill="#7c2d12"
      />

      {/* Bottom Orange Section */}
      <path
        d="M13.5 38 L34.5 38 L32.2 31 L15.8 31 Z"
        fill="url(#vlcOrange)"
        stroke="#c2410c"
        strokeWidth="0.5"
      />

      {/* Bottom White Reflective Band */}
      <path
        d="M16 31.5 L32 31.5 L30.2 24.5 L17.8 24.5 Z"
        fill="url(#vlcWhite)"
        stroke="#9ca3af"
        strokeWidth="0.5"
      />

      {/* Middle Orange Section */}
      <path
        d="M18 25 L30 25 L28.6 19 L19.4 19 Z"
        fill="url(#vlcOrange)"
        stroke="#c2410c"
        strokeWidth="0.5"
      />

      {/* Upper White Reflective Band */}
      <path
        d="M19.5 19.5 L28.5 19.5 L27.2 13.5 L20.8 13.5 Z"
        fill="url(#vlcWhite)"
        stroke="#9ca3af"
        strokeWidth="0.5"
      />

      {/* Top Orange Section */}
      <path
        d="M21 14 L27 14 L25.8 7 L22.2 7 Z"
        fill="url(#vlcOrange)"
        stroke="#c2410c"
        strokeWidth="0.5"
      />

      {/* Rounded Tip */}
      <path
        d="M22.2 7.2 Q24 4.5 25.8 7.2 Z"
        fill="url(#vlcTip)"
        stroke="#c2410c"
        strokeWidth="0.5"
      />

      {/* Subtle 3D Shine Down the Left-Center Side */}
      <path
        d="M23.5 6 L24.5 6 L28.5 38 L27 38 Z"
        fill="#ffffff"
        fillOpacity="0.18"
      />
    </svg>
  );
};
