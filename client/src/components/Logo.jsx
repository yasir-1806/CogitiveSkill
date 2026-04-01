import React from 'react';
import finalLogo from '../assets/logo-final.png';

export default function Logo({ size = 40, className = "" }) {
  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={finalLogo}
        alt="CognIQ"
        className="w-full h-full object-contain"
        style={{
          filter: 'drop-shadow(0 0 4px var(--accent-primary))',
          opacity: 1
        }}
      />
    </div>
  );
}
