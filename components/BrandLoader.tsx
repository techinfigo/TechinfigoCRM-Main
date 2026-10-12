import React from 'react';

/**
 * Techinfigo logo loader: the ring turns and the yellow bar bounces.
 * Styles live in index.html (so the same loader also shows before the app
 * has started). `full` covers the screen; otherwise it sits inline.
 */
export const BrandLoader: React.FC<{ message?: string; full?: boolean; small?: boolean; className?: string }> = ({
  message = 'Loading',
  full = false,
  small = false,
  className = '',
}) => (
  <div
    className={`tf-loader ${full ? 'tf-loader--full' : 'tf-loader--inline py-8'} ${small ? 'tf-loader--sm' : ''} ${className}`}
    role="status"
    aria-label={message}
  >
    <svg className="tf-loader__mark" viewBox="0 0 100 100" aria-hidden="true">
      <circle className="tf-loader__glow" cx="50" cy="55" r="38" fill="none" stroke="#fcb632" strokeWidth="2.5" />
      <circle className="tf-loader__track tf-loader__ringc" cx="50" cy="55" r="27" fill="none" stroke="#fff" strokeWidth="9" />
      <g className="tf-loader__ring">
        <circle className="tf-loader__ringc" cx="50" cy="55" r="27" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeDasharray="120 50" transform="rotate(-62 50 55)" />
      </g>
      <rect className="tf-loader__bar" x="44.5" y="14" width="11" height="38" rx="5.5" fill="#fcb632" stroke="#001d21" strokeWidth="3" />
    </svg>
    {!small && (
      <div className="tf-loader__word">
        TECH<b>IN</b>FIGO
      </div>
    )}
    <div className="tf-loader__msg">
      {message.replace(/[.…]+$/, '')}
      <span className="tf-loader__dots" />
    </div>
  </div>
);

export default BrandLoader;
