
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './Button';
import { motion, AnimatePresence } from 'motion/react';

interface DatePickerProps {
  value: string; // ISO date string YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  id?: string;
  name?: string;
  error?: string;
  required?: boolean;
  min?: string;
  max?: string;
  className?: string;
  containerClassName?: string;
}

const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  id,
  name,
  error,
  required,
  min,
  max,
  className,
  containerClassName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const initialDate = value ? new Date(value) : new Date();
  const safeViewDate = isNaN(initialDate.getTime()) ? new Date() : initialDate;
  
  const [viewDate, setViewDate] = useState(safeViewDate);
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({});

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const inputId = id || name;

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewDate(d);
      }
    }
  }, [value]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const dropdownHeight = 320;
            const dropdownWidth = 280;
            
            let top = rect.bottom + 4;
            if (top + dropdownHeight > window.innerHeight && rect.top > dropdownHeight) {
                top = rect.top - dropdownHeight - 4;
            }

            let left = rect.left;
            if (left + dropdownWidth > window.innerWidth) {
                left = rect.right - dropdownWidth;
            }

            setPositionStyle({
                position: 'fixed',
                top: `${top}px`,
                left: `${left}px`,
                zIndex: 9999,
            });
        }
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };
  
  const handleYearChange = (year: number) => {
     setViewDate(new Date(year, viewDate.getMonth(), 1));
  }

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const offset = selectedDate.getTimezoneOffset();
    const localDate = new Date(selectedDate.getTime() - (offset * 60 * 1000));
    onChange(localDate.toISOString().split('T')[0]);
    setIsOpen(false);
  };
  
  const handleTodayClick = () => {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localDate = new Date(today.getTime() - (offset * 60 * 1000));
      onChange(localDate.toISOString().split('T')[0]);
      setIsOpen(false);
  }
  
  const handleClear = () => {
      onChange('');
      setIsOpen(false);
  }

  const renderCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = value === dateStr;
      const isToday = todayStr === dateStr;
      const isDisabled = (min && dateStr < min) || (max && dateStr > max);

      days.push(
        <button
          key={day}
          type="button"
          onClick={(e) => { e.stopPropagation(); !isDisabled && handleDateClick(day); }}
          disabled={isDisabled}
          className={`
            w-8 h-8 flex items-center justify-center rounded-full text-sm transition-all duration-200
            ${isSelected 
                ? 'bg-premium-accent text-white shadow-md scale-105 font-semibold' 
                : isToday
                    ? 'text-premium-accent font-bold border border-premium-accent'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            }
            ${isDisabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : ''}
          `}
        >
          {day}
        </button>
      );
    }
    return days;
  };
  
  const displayValue = value ? new Date(value).toLocaleDateString() : '';

  return (
    <div className={`relative w-full ${containerClassName || ''}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text-muted dark:text-text-muted mb-1">
          {label} {required && '*'}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-slate-800 
          border rounded-lg shadow-sm transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-premium-accent/20 focus:border-premium-accent
          ${error 
            ? 'border-status-negative text-status-negative focus:border-status-negative focus:ring-status-negative/20' 
            : 'border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-500'
          }
          ${className || ''}
        `}
      >
        <span className={!displayValue ? 'text-slate-400' : ''}>
          {displayValue || 'Select date'}
        </span>
        <CalendarIcon className={`w-4 h-4 ${error ? 'text-status-negative' : 'text-slate-400'}`} />
      </button>
      {error && <p className="mt-1 text-xs text-status-negative">{error}</p>}

      <AnimatePresence>
        {isOpen && createPortal(
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            style={positionStyle}
            className="fixed w-[280px] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl ring-1 ring-black/5 border border-slate-200 dark:border-slate-700 p-4 z-[9999]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 flex gap-1">
                  <span>{monthNames[viewDate.getMonth()]}</span>
                  <select 
                      value={viewDate.getFullYear()} 
                      onChange={(e) => handleYearChange(parseInt(e.target.value))}
                      className="bg-transparent border-none p-0 cursor-pointer text-slate-800 dark:text-slate-100 font-semibold focus:ring-0 appearance-none"
                      onClick={(e) => e.stopPropagation()}
                  >
                      {Array.from({ length: 20 }, (_, i) => viewDate.getFullYear() - 10 + i).map(y => (
                          <option key={y} value={y} className="text-black dark:text-white bg-white dark:bg-zinc-800">{y}</option>
                      ))}
                  </select>
              </div>
              <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
                  <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map(d => (
                <div key={d} className="text-center text-xs font-medium text-slate-400 uppercase w-8">
                  {d}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1 row-gap-2">
              {renderCalendarDays()}
            </div>
            
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={handleClear} className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors font-medium">
                    Clear
                </button>
                <button type="button" onClick={handleTodayClick} className="text-xs text-premium-accent hover:text-premium-accent-hover font-medium transition-colors">
                    Today
                </button>
            </div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
};
