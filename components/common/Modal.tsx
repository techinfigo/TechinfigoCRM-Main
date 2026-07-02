
import React, { useEffect, useCallback, useRef, useId } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode; 
  children: React.ReactNode;
  footer?: React.ReactNode; 
  size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  overrideZIndex?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'lg', overrideZIndex }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (isOpen) {
      openerRef.current = document.activeElement as HTMLElement;
    } else {
      openerRef.current?.focus();
      openerRef.current = null;
    }
  }, [isOpen]);

  // Focus trap and Escape key logic
  useEffect(() => {
    if (!isOpen) return;

    const modalElement = modalRef.current;
    if (!modalElement) return;
    
    const focusableElements = Array.from(modalElement.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => !(el as HTMLElement).hasAttribute('disabled'));

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      
      if (event.key === 'Tab') {
        if (event.shiftKey) { // Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            event.preventDefault();
          }
        } else { // Tab
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            event.preventDefault();
          }
        }
      }
    };

    // Auto-focus the first element or the modal itself.
    // Delay slightly to allow for transitions.
    setTimeout(() => {
        const firstFocusable = modalElement.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        } else {
            modalElement.focus();
        }
    }, 100);

    // Use a single listener on the modal element for Tab trapping,
    // and one on the window for the global Escape key.
    modalElement.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      modalElement.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full w-full h-full min-h-screen',
  };

  const isFullScreen = size === 'full';
  const zIndexClass = overrideZIndex || 'z-[1000]';

  return (
    <div 
      className={isFullScreen 
        ? `fixed inset-0 bg-bg-base dark:bg-bg-muted ${zIndexClass} flex flex-col transition-opacity duration-300 ease-in-out print:hidden animate-[fade-in_0.2s_ease-out]`
        : `fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur ${zIndexClass} flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out print:hidden animate-[fade-in_0.2s_ease-out]`
      }
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <style>
        {`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scale-in {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
      <div 
        ref={modalRef}
        tabIndex={-1}
        className={isFullScreen
          ? `bg-bg-base text-text-base dark:bg-bg-muted dark:text-text-base w-full h-full flex flex-col overflow-hidden animate-[scale-in_0.2s_ease-out]`
          : `bg-bg-base text-text-base dark:bg-bg-muted dark:text-text-base rounded-xl shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col overflow-hidden border border-border-muted dark:border-border-muted animate-[scale-in_0.2s_ease-out]`
        }
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex items-center justify-between p-5 border-b border-border-base dark:border-border-muted sticky top-0 bg-bg-base dark:bg-bg-muted z-10">
          {typeof title === 'string' ? (
            <h3 id={titleId} className="text-lg md:text-xl font-semibold text-text-heading dark:text-text-heading">{title}</h3>
          ) : (
            <div id={titleId}>{title}</div>
          )}
          <button
            onClick={onClose}
            className="text-text-muted dark:text-text-muted transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div className="p-5 md:p-6 overflow-y-auto space-y-4 md:space-y-5 flex-grow">
          {children}
        </div>
        {footer && (
          <div 
            className="p-5 border-t border-border-base dark:border-border-muted bg-slate-50 dark:bg-slate-800/50 sticky bottom-0 flex justify-end space-x-3 z-10"
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
