import React from 'react';

/**
 * Techinfigo loader: the real logo, its yellow bar turning round the white
 * ring like a watch hand. Styles live in index.html (so the same loader
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
      <img className="tf-loader__ring" alt="" src="/icons/logo-ring.png" />
      <img className="tf-loader__bar" alt="" src="/icons/logo-bar.png" />
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
