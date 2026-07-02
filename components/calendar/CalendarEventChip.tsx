import React from 'react';
import { CalendarEvent } from '../../types';

interface CalendarEventChipProps {
  event: CalendarEvent;
}

export const CalendarEventChip: React.FC<CalendarEventChipProps> = ({ event }) => {
  return (
    <div
      key={event.id}
      title={event.title}
      className={`px-1.5 py-0.5 rounded text-xxs font-semibold truncate ${event.colorClass}`}
    >
      {event.title}
    </div>
  );
};
