import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type DateRange = {
  startDate: Date | null;
  endDate: Date | null;
};

interface DateRangePickerProps {
  onApply: (range: DateRange) => void;
  initialRange?: DateRange;
}

interface Preset {
  label: string;
  divider?: boolean;
}

const presets: Preset[] = [
  { label: 'All Time' },
  { label: 'Today', divider: true },
  { label: 'Yesterday' },
  { label: 'Last 7 Days' },
  { label: 'Last 30 Days' },
  { label: 'This Month' },
  { label: 'Last Month' },
  { label: 'This Quarter', divider: true },
  { label: 'Last Quarter' },
  { label: 'Year to Date' },
  { label: 'This Year' },
];

const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
};

const CalendarMonth: React.FC<{
    monthDate: Date;
    range: DateRange;
    onDateClick: (date: Date) => void;
}> = ({ monthDate, range, onDateClick }) => {
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dates = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div className="p-2 w-[260px]">
            <div className="text-center font-semibold mb-2 text-slate-800 dark:text-slate-100 text-sm">
                {monthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-text-muted dark:text-slate-400 mb-1">
                {daysOfWeek.map(day => <div key={day} className="w-8 h-8 flex items-center justify-center">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="w-8 h-8"></div>)}
                {dates.map((date, i) => {
                    const isSelectedStart = range.startDate && date.getTime() === range.startDate.getTime();
                    const isSelectedEnd = range.endDate && date.getTime() === range.endDate.getTime();
                    const isInRange = range.startDate && range.endDate && date > range.startDate && date < range.endDate;
                    const isToday = date.getTime() === today.getTime();
                    
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onDateClick(date)}
                            className={`w-8 h-8 rounded-full text-xs transition-all duration-200 text-text-base dark:text-text-base
                                ${isSelectedStart && isSelectedEnd ? 'bg-premium-accent text-white font-bold shadow-md z-10' :
                                  isSelectedStart ? 'bg-premium-accent text-white font-bold rounded-r-none shadow-sm z-10' :
                                  isSelectedEnd ? 'bg-premium-accent text-white font-bold rounded-l-none shadow-sm z-10' :
                                  isInRange ? 'bg-premium-accent/10 dark:bg-premium-accent/20 rounded-none text-premium-accent' :
                                  'hover:bg-slate-100 dark:hover:bg-slate-700'
                                }
                                ${isToday && !isSelectedStart && !isSelectedEnd && !isInRange ? 'border border-premium-accent text-premium-accent font-medium' : ''}
                            `}
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ onApply, initialRange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [range, setRange] = useState<DateRange>(initialRange || { startDate: null, endDate: null });
  const [displayRange, setDisplayRange] = useState<DateRange>(initialRange || { startDate: null, endDate: null });
  
  const [appliedLabel, setAppliedLabel] = useState<string>(() => {
    if (initialRange) {
      if (initialRange.startDate && initialRange.endDate) {
        if (initialRange.startDate.getTime() === initialRange.endDate.getTime()) {
          return formatDate(initialRange.startDate);
        }
        return `${formatDate(initialRange.startDate)} - ${formatDate(initialRange.endDate)}`;
      }
      if (initialRange.startDate === null && initialRange.endDate === null) {
        return 'All Time';
      }
    }
    return 'Date Range';
  });

  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().setDate(1)));
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (isOpen) {
      const calculatePosition = () => {
        if (buttonRef.current) {
          const buttonRect = buttonRef.current.getBoundingClientRect();
          const PADDING = 8;
          const isMobile = window.innerWidth < 640;
          const popoverWidth = isMobile ? 280 : 715;
          const popoverHeight = isMobile ? 550 : 390;

          let top = buttonRect.bottom + PADDING;
          if (top + popoverHeight > window.innerHeight) {
            if (buttonRect.top - popoverHeight - PADDING > 0) {
              top = buttonRect.top - popoverHeight - PADDING;
            } else {
              top = Math.max(PADDING, window.innerHeight - popoverHeight - PADDING);
            }
          }

          let left = buttonRect.right - popoverWidth;
          if (left < PADDING) {
            left = PADDING;
          }
          if (left + popoverWidth > window.innerWidth - PADDING) {
            left = window.innerWidth - popoverWidth - PADDING;
          }

          setPortalStyle({
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            zIndex: 9999,
          });
        }
      };

      const timer = setTimeout(calculatePosition, 0);
      window.addEventListener('scroll', calculatePosition, true);
      window.addEventListener('resize', calculatePosition);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', calculatePosition, true);
        window.removeEventListener('resize', calculatePosition);
      };
    }
  }, [isOpen]);

  // Sync state when initialRange changes from parent (e.g. view shifts or resets)
  useEffect(() => {
    if (initialRange) {
      setRange(initialRange);
      setDisplayRange(initialRange);
      if (initialRange.startDate && initialRange.endDate) {
        if (initialRange.startDate.getTime() === initialRange.endDate.getTime()) {
          setAppliedLabel(formatDate(initialRange.startDate));
        } else {
          setAppliedLabel(`${formatDate(initialRange.startDate)} - ${formatDate(initialRange.endDate)}`);
        }
      } else if (initialRange.startDate === null && initialRange.endDate === null) {
        setAppliedLabel('All Time');
      }
    } else {
      setRange({ startDate: null, endDate: null });
      setDisplayRange({ startDate: null, endDate: null });
      setAppliedLabel('Date Range');
    }
  }, [initialRange]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setRange(displayRange); 
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, displayRange]);

  const handleApply = () => {
    let rangeToApply = range.startDate && !range.endDate 
        ? { startDate: range.startDate, endDate: range.startDate } 
        : range;

    if (rangeToApply.endDate) {
        const endOfDay = new Date(rangeToApply.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        rangeToApply = { ...rangeToApply, endDate: endOfDay };
    }

    onApply(rangeToApply);
    setDisplayRange(rangeToApply);
    
    if (rangeToApply.startDate === null && rangeToApply.endDate === null) {
        setAppliedLabel('All Time');
    } else if (rangeToApply.startDate) {
        if (rangeToApply.endDate && rangeToApply.startDate.getTime() === rangeToApply.endDate.getTime()) {
            setAppliedLabel(formatDate(rangeToApply.startDate));
        } else {
            const start = formatDate(rangeToApply.startDate);
            const end = formatDate(rangeToApply.endDate || rangeToApply.startDate);
            setAppliedLabel(`${start} - ${end}`);
        }
    } else {
        setAppliedLabel('Date Range');
    }

    setIsOpen(false);
  };
  
  const handleCancel = () => {
    setRange(displayRange);
    setIsOpen(false);
  };

  const handleDateClick = (date: Date) => {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    if (!range.startDate || range.endDate) {
      setRange({ startDate: d, endDate: null });
    } else if (d < range.startDate) {
      setRange({ startDate: d, endDate: range.startDate });
    } else {
      setRange({ ...range, endDate: d });
    }
  };

  const handlePresetClick = (presetLabel: string) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let start: Date | null = new Date(today);
      let end: Date | null = new Date(today);
      const year = today.getFullYear();
      const month = today.getMonth();

      switch (presetLabel) {
          case 'All Time':
              start = null;
              end = null;
              break;
          case 'Today':
              break;
          case 'Yesterday':
              start.setDate(start.getDate() - 1);
              end.setDate(end.getDate() - 1);
              break;
          case 'Last 7 Days':
              start.setDate(start.getDate() - 6);
              end.setDate(end.getDate());
              break;
          case 'Last 30 Days':
              start.setDate(start.getDate() - 29);
              end.setDate(end.getDate());
              break;
          case 'This Month':
              start = new Date(year, month, 1);
              end = new Date(year, month + 1, 0);
              break;
          case 'Last Month':
              start = new Date(year, month - 1, 1);
              end = new Date(year, month, 0);
              break;
          case 'This Quarter':
              const currentQuarter = Math.floor(month / 3);
              start = new Date(year, currentQuarter * 3, 1);
              end = new Date(year, currentQuarter * 3 + 3, 0);
              break;
          case 'Last Quarter':
              const lastQuarterStartMonth = Math.floor(month / 3) * 3 - 3;
              start = new Date(year, lastQuarterStartMonth, 1);
              end = new Date(year, lastQuarterStartMonth + 3, 0);
              break;
          case 'Year to Date':
              start = new Date(year, 0, 1);
              end = today;
              break;
          case 'This Year':
              start = new Date(year, 0, 1);
              end = new Date(year, 11, 31);
              break;
      }
      setRange({ startDate: start, endDate: end });
      if(start) {
        setCurrentMonth(new Date(start.getFullYear(), start.getMonth(), 1));
      }
  };
  
  const changeMonth = (offset: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const nextMonthDate = useMemo(() => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1), [currentMonth]);

  return (
    <div className="relative inline-block text-left">
      <Button 
        ref={buttonRef}
        variant="outline" 
        size="sm" 
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
        }} 
        leftIcon={<CalendarIcon className="w-4 h-4" />}
      >
        {appliedLabel}
      </Button>
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={pickerRef}
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              style={portalStyle}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row overflow-y-auto max-h-[90vh] sm:max-h-none sm:overflow-visible z-[9999] w-[280px] sm:w-[715px]"
          >
            {/* Preset Column */}
            <div className="w-full sm:w-48 p-2 border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-slate-700 flex flex-col bg-slate-50 dark:bg-slate-800/50 sm:rounded-l-xl">
                <h4 className="font-semibold text-xs px-2 py-2 mb-1 text-slate-500 dark:text-slate-400 uppercase tracking-wider">Presets</h4>
                <ul className="space-y-0.5 overflow-y-auto max-h-60 sm:max-h-none">
                    {presets.map(p => (
                        <li key={p.label}>
                            {p.divider && <div className="my-1 h-px bg-slate-200 dark:bg-slate-700 mx-2" />}
                            <button type="button" onClick={() => handlePresetClick(p.label)} className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-secondary-accent/10 hover:text-secondary-accent dark:hover:bg-secondary-accent/20 dark:hover:text-secondary-accent transition-all text-slate-700 dark:text-slate-300 font-medium">
                                {p.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            {/* Calendar Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 sm:rounded-r-xl">
                <div className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-700">
                    <Button variant="ghost" size="sm" className="p-1" onClick={() => changeMonth(-1)}><ChevronLeft className="w-4 h-4"/></Button>
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {range.startDate ? formatDate(range.startDate) : 'Start'} 
                        <span className="mx-2 text-slate-400">→</span> 
                        {range.endDate ? formatDate(range.endDate) : 'End'}
                    </div>
                    <Button variant="ghost" size="sm" className="p-1" onClick={() => changeMonth(1)}><ChevronRight className="w-4 h-4"/></Button>
                </div>
                <div className="flex flex-col sm:flex-row p-2 gap-2">
                    <CalendarMonth monthDate={currentMonth} range={range} onDateClick={handleDateClick} />
                    <div className="hidden sm:block w-px bg-slate-100 dark:bg-slate-700 my-2"></div>
                    <CalendarMonth monthDate={nextMonthDate} range={range} onDateClick={handleDateClick} />
                </div>
                <div className="flex justify-end p-3 border-t border-slate-100 dark:border-slate-700 space-x-2 bg-slate-50 dark:bg-slate-800/50 sm:rounded-br-xl">
                    <Button variant="secondary" size="sm" onClick={handleCancel}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={handleApply}>Apply Range</Button>
                </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
