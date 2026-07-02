import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface SelectOption {
  value: string;
  label: string;
  secondaryLabel?: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  labelClassName?: string;
  direction?: 'auto' | 'up' | 'down';
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  error,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  searchable = false,
  searchPlaceholder = 'Search...',
  labelClassName = '',
  direction = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, bottom: 0, left: 0, width: 0 });

  const selectedOption = options.find((opt) => opt.value === value);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        bottom: window.innerHeight - rect.top,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
    }
  }, [isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedEl = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(clickedEl) &&
        (!menuRef.current || !menuRef.current.contains(clickedEl))
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on scroll or resize to prevent floating drift
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => {
      setIsOpen(false);
    };
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  // Reset search query when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!disabled) {
      if (!isOpen && containerRef.current) {
        if (direction === 'up') {
          setOpenUpward(true);
        } else if (direction === 'down') {
          setOpenUpward(false);
        } else {
          const rect = containerRef.current.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;
          // If there's less than 280px of space below and more space above, open upward
          if (spaceBelow < 280 && spaceAbove > spaceBelow) {
            setOpenUpward(true);
          } else {
            setOpenUpward(false);
          }
        }
      }
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  // Filter options based on search query
  const filteredOptions = options.filter((opt) => {
    const text = (opt.label + ' ' + (opt.secondaryLabel || '')).toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className={`block text-sm font-medium text-text-muted dark:text-text-muted mb-1 ${labelClassName}`}>
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`
          flex items-center justify-between w-full py-2 px-3 bg-white dark:bg-slate-800 border rounded-lg shadow-sm text-left text-sm transition-all duration-150 cursor-pointer
          ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}
          ${error ? 'border-red-500 dark:border-red-400 focus:ring-red-500' : 'border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-secondary-accent dark:focus:ring-secondary-accent focus:border-secondary-accent dark:focus:border-secondary-accent'}
        `}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption ? (
            <>
              {selectedOption.icon}
              <span>{selectedOption.label}</span>
              {selectedOption.secondaryLabel && (
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                  ({selectedOption.secondaryLabel})
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
          )}
        </span>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Floating Menu */}
      {isOpen && createPortal(
        <div 
          ref={menuRef}
          style={{
            position: 'fixed',
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 1400,
            ...(openUpward
              ? { bottom: `${coords.bottom + 4}px` }
              : { top: `${coords.top + 4}px` })
          }}
          className="rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 overflow-hidden animate-[fade-in_0.15s_ease-out]"
        >
          {searchable && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-700/50">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-accent focus:border-transparent placeholder-slate-400 dark:placeholder-slate-500"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          )}

          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">
                No options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={`
                      w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors cursor-pointer
                      ${isSelected ? 'bg-secondary-accent/15 dark:bg-secondary-accent/20 text-secondary-accent font-medium' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}
                    `}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {opt.icon}
                      <span>{opt.label}</span>
                      {opt.secondaryLabel && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                          {opt.secondaryLabel}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <svg className="w-5 h-5 text-secondary-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}

      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};
