
import React from 'react';
import { CalendarEvent } from '../../types';
import { CalendarEventChip } from './CalendarEventChip';

interface CalendarGridProps {
  days: (Date | null)[];
  events: CalendarEvent[];
  today: Date;
  currentMonth: number;
  onDayClick: (day: Date) => void;
  maxEventsPerCell?: number;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ 
  days, events, today, currentMonth, onDayClick, maxEventsPerCell = 2 
}) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700/50 rounded-lg overflow-hidden shadow-inner">
      {daysOfWeek.map(day => (
        <div key={day} className="py-2 text-center text-xs font-semibold text-text-muted dark:text-text-muted bg-slate-100 dark:bg-slate-800/40">{day}</div>
      ))}
      {days.map((day, index) => {
        const isCurrentMonth = day ? day.getMonth() === currentMonth : false;
        const isToday = day && day.getTime() === today.getTime();
        const eventsForDay = day ? events.filter(event => 
          new Date(event.date).toDateString() === day.toDateString()
        ) : [];

        return (
          <div
            key={index}
            onClick={() => day && onDayClick(day)}
            className={`
              p-1.5 min-h-[120px] relative transition-all duration-150 text-left align-top flex flex-col
              ${day ? 'bg-bg-base dark:bg-bg-base/90 cursor-pointer' : 'bg-slate-50 dark:bg-slate-800/30'}
              ${isToday ? 'border-2 border-secondary-accent -m-0.5 z-10' : ''}
              ${!isCurrentMonth ? 'opacity-60 dark:opacity-40' : ''}
            `}
          >
            {day && (
              <>
                <span className={`text-xs font-semibold ${isToday ? 'text-secondary-accent' : 'text-text-muted dark:text-slate-400'}`}>
                  {day.getDate()}
                </span>
                <div className="mt-1 space-y-1 overflow-hidden flex-grow">
                  {eventsForDay.slice(0, maxEventsPerCell).map(event => (
                    <CalendarEventChip key={event.id} event={event} />
                  ))}
                  {eventsForDay.length > maxEventsPerCell && (
                    <div className="text-xxs text-text-muted dark:text-slate-400 text-center mt-0.5">
                      +{eventsForDay.length - maxEventsPerCell} more
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
