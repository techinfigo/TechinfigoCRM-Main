import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './Button';

interface DateTimePickerProps {
  label?: string;
  value: string; // "YYYY-MM-DDTHH:mm" (same format as native datetime-local)
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const parseValue = (value: string): { date: Date | null; time: string } => {
  if (!value) return { date: null, time: '09:00' };
  const [datePart, timePart] = value.split('T');
  if (!datePart) return { date: null, time: '09:00' };
  const [y, m, d] = datePart.split('-').map(Number);
  return { date: new Date(y, m - 1, d), time: timePart || '09:00' };
};

const formatDisplay = (value: string): string => {
  if (!value) return 'Select date & time';
  const { date, time } = parseValue(value);
  if (!date) return 'Select date & time';
  const dateLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const [h, min] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${dateLabel}, ${hour12}:${String(min).padStart(2, '0')} ${period}`;
};

const toValue = (date: Date, time: string): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}T${time}`;
};

export const DateTimePicker: React.FC<DateTimePickerProps> = ({ label, value, onChange, error, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const parsed = parseValue(value);
  const [tempDate, setTempDate] = useState<Date | null>(parsed.date);
  const [tempTime, setTempTime] = useState<string>(parsed.time);
  const [currentMonth, setCurrentMonth] = useState(parsed.date || new Date());
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const p = parseValue(value);
    setTempDate(p.date);
    setTempTime(p.time);
    if (p.date) setCurrentMonth(p.date);
  }, [value, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const calculatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const PADDING = 8;
      const popoverWidth = 300;
      const popoverHeight = 400;
      let top = rect.bottom + PADDING;
      if (top + popoverHeight > window.innerHeight) {
        top = Math.max(PADDING, rect.top - popoverHeight - PADDING);
      }
      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - PADDING) {
        left = window.innerWidth - popoverWidth - PADDING;
      }
      setPortalStyle({ position: 'fixed', top: `${top}px`, left: `${left}px`, zIndex: 9999 });
    };
    const timer = setTimeout(calculatePosition, 0);
    window.addEventListener('scroll', calculatePosition, true);
    window.addEventListener('resize', calculatePosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        pickerRef.current && !pickerRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleConfirm = () => {
    if (tempDate) {
      onChange(toValue(tempDate, tempTime));
    }
    setIsOpen(false); // Explicitly closes on selection - no more lingering native picker
  };

  const month = currentMonth.getMonth();
  const year = currentMonth.getFullYear();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-text-muted dark:text-text-muted mb-1">{label}</label>}
      <Button
        ref={buttonRef}
        type="button"
        variant="outline"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
        leftIcon={<CalendarIcon className="w-4 h-4" />}
        className={`w-full justify-start font-normal ${error ? 'border-red-500' : ''}`}
      >
        {formatDisplay(value)}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {isOpen && createPortal(
        <div
          ref={pickerRef}
          style={portalStyle}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-[300px] p-3"
        >
          <div className="flex justify-between items-center mb-2">
            <button type="button" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">‹</button>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
            <button type="button" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">›</button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs text-text-muted dark:text-slate-400 mb-1">
            {daysOfWeek.map(d => <div key={d} className="w-8 h-8 flex items-center justify-center">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} className="w-8 h-8" />)}
            {dates.map((d, i) => {
              const isSelected = tempDate && d.toDateString() === tempDate.toDateString();
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTempDate(d)}
                  className={`w-8 h-8 rounded-full text-xs transition-colors
                    ${isSelected ? 'bg-premium-accent text-white font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-text-base dark:text-text-base'}`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <label className="block text-xs font-medium text-text-muted dark:text-text-muted mb-1">Time</label>
            <input
              type="time"
              value={tempTime}
              onChange={(e) => setTempTime(e.target.value)}
              className="w-full p-2 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md text-sm text-text-base dark:text-text-base focus:outline-none focus:ring-1 focus:ring-premium-accent"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="button" variant="primary" size="sm" onClick={handleConfirm} disabled={!tempDate}>Set</Button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
