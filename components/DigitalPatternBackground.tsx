
import React from 'react';

export const DigitalPatternBackground: React.FC = () => (
  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id="subtleGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.7" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {/* Subtle background grid */}
      <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(128, 178, 237, 0.02)" strokeWidth="0.3"/>
      </pattern>
      <rect width="100%" height="100%" fill="url(#smallGrid)" />

      {/* Larger connecting lines */}
      <line x1="10%" y1="20%" x2="30%" y2="45%" stroke="rgba(128, 178, 237, 0.06)" strokeWidth="0.8"/>
      <line x1="25%" y1="15%" x2="45%" y2="55%" stroke="rgba(128, 178, 237, 0.04)" strokeWidth="0.4" strokeDasharray="3 3"/>
      <line x1="70%" y1="10%" x2="90%" y2="35%" stroke="rgba(128, 178, 237, 0.07)" strokeWidth="1" filter="url(#subtleGlow)"/>
      <line x1="60%" y1="80%" x2="85%" y2="60%" stroke="rgba(128, 178, 237, 0.05)" strokeWidth="0.7"/>
      <line x1="5%" y1="70%" x2="25%" y2="90%" stroke="rgba(128, 178, 237, 0.04)" strokeWidth="0.6" strokeDasharray="4 4"/>
      <line x1="50%" y1="5%" x2="58%" y2="40%" stroke="rgba(128, 178, 237, 0.05)" strokeWidth="0.8"/>
      <line x1="35%" y1="65%" x2="65%" y2="95%" stroke="rgba(128, 178, 237, 0.06)" strokeWidth="1"/>
      <line x1="80%" y1="45%" x2="95%" y2="60%" stroke="rgba(128, 178, 237, 0.03)" strokeWidth="0.4" filter="url(#subtleGlow)"/>
      <line x1="2%" y1="50%" x2="30%" y2="10%" stroke="rgba(128, 178, 237, 0.04)" strokeWidth="0.5"/>
      <line x1="98%" y1="50%" x2="70%" y2="90%" stroke="rgba(128, 178, 237, 0.04)" strokeWidth="0.5"/>


      {/* Dots (more dots for better coverage, ensure low opacity) */}
      {[...Array(40)].map((_, i) => (
        <circle 
          key={`dot-${i}`}
          cx={`${Math.random() * 100}%`} 
          cy={`${Math.random() * 100}%`} 
          r={`${Math.random() * 1.2 + 0.3}`} // radius between 0.3 and 1.5
          fill={`rgba(128, 178, 237, ${Math.random() * 0.04 + 0.02})`} // opacity between 0.02 and 0.06
        />
      ))}
       {/* More prominent "node" dots */}
      <circle cx="30%" cy="45%" r="2.5" fill="rgba(128, 178, 237, 0.05)" filter="url(#subtleGlow)"/>
      <circle cx="90%" cy="35%" r="2" fill="rgba(128, 178, 237, 0.04)" />
      <circle cx="60%" cy="80%" r="2.2" fill="rgba(128, 178, 237, 0.06)" />
      <circle cx="58%" cy="40%" r="1.8" fill="rgba(128, 178, 237, 0.03)" filter="url(#subtleGlow)"/>
      <circle cx="80%" cy="45%" r="2" fill="rgba(128, 178, 237, 0.05)" />
    </svg>
  </div>
);
