
import React from 'react';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'; // Added more sizes
  footer?: React.ReactNode;
}

export const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onClose, title, children, size = 'xl', footer }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md', // approx 512px
    lg: 'max-w-lg', // approx 576px
    xl: 'max-w-xl', // approx 672px
    '2xl': 'max-w-2xl', // approx 768px
    '3xl': 'max-w-3xl', // approx 896px
    '4xl': 'max-w-4xl', // approx 1024px
    '5xl': 'max-w-5xl', // approx 1152px
  };

  return (
    <div 
      className="fixed inset-0 z-[60] print:hidden" // Ensure high z-index
      aria-labelledby="slide-over-title" 
      role="dialog" 
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out" 
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full">
        <div 
          className={`transform transition ease-in-out duration-300 sm:duration-500 ${isOpen ? 'translate-x-0' : 'translate-x-full'} w-screen ${sizeClasses[size]}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-full flex-col overflow-hidden bg-bg-base dark:bg-slate-800 shadow-2xl border-l border-border-base dark:border-slate-700">
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-900/90 px-4 py-4 sm:px-6 sticky top-0 z-10 border-b border-border-base dark:border-slate-700">
              <div className="flex items-start justify-between">
                {typeof title === 'string' ? (
                    <h2 id="slide-over-title" className="text-lg font-semibold text-text-base dark:text-slate-100 leading-tight">
                    {title}
                    </h2>
                ) : (
                    title // Render as ReactNode if not a string
                )}
                <div className="ml-3 flex h-7 items-center">
                  <button
                    type="button"
                    className="rounded-md p-1 text-text-muted dark:text-slate-400 hover:text-text-base dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-premium-accent"
                    onClick={onClose}
                    aria-label="Close panel"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="relative flex-1 overflow-y-auto px-4 py-5 sm:px-6 custom-scrollbar">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex-shrink-0 border-t border-border-base dark:border-slate-700 px-4 py-4 sm:px-6 sticky bottom-0 bg-bg-muted dark:bg-slate-700/50 z-10">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};