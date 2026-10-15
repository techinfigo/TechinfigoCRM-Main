import React from 'react';

/**
 * Techinfigo loader: the real logo on its dark tile, a yellow ring turning
 * round it and a soft pulse. Styles live in index.html (so the same loader
 * also shows before the app has started). `full` covers the screen;
 * otherwise it sits inline.
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
    <div className="tf-loader__mark" aria-hidden="true">
      <span className="tf-loader__halo" />
      <svg className="tf-loader__orbit" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(252,182,50,.18)" strokeWidth="3" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#fcb632" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="70 220" />
      </svg>
      <span className="tf-loader__tile">
        <img alt="" src="/icons/logo-mark.png" />
      </span>
    </div>
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
