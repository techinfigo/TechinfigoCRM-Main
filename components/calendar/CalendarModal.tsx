import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { CalendarEvent } from '../../types';
import { CalendarEventChip } from './CalendarEventChip';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, 'id' | 'originalItem' | 'colorClass'>) => void;
}

const eventTypes: CalendarEvent['type'][] = ['project', 'task', 'invoice', 'lead', 'audit', 'leave'];

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, date, events, onAddEvent }) => {
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<CalendarEvent['type']>('task');

  const handleAddEvent = () => {
    if (!newEventTitle.trim()) {
      alert("Event title cannot be empty.");
      return;
    }
    // Note: 'originalItem' and 'colorClass' would be handled by the main view logic.
    // This is a simplified addition for demonstration.
    onAddEvent({
      title: newEventTitle,
      date: date,
      type: newEventType,
    });
    setNewEventTitle('');
    setNewEventType('task');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Events for: ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      size="lg"
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-6 px-1">
        <div>
          <h3 className="text-md font-semibold text-text-heading dark:text-text-heading mb-3">Existing Events</h3>
          {events.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {events.map(event => (
                <div key={event.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-border-muted">
                  <CalendarEventChip event={event} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted dark:text-slate-400 italic">No events scheduled for this day.</p>
          )}
        </div>
        
        <div className="border-t border-border-base dark:border-border-muted pt-6">
          <h3 className="text-md font-semibold text-text-heading dark:text-text-heading mb-3">Add New Event (Conceptual)</h3>
          <div className="space-y-4">
            <Input 
              label="Event Title"
              value={newEventTitle}
              onChange={e => setNewEventTitle(e.target.value)}
              placeholder="e.g., Team Sync-up"
            />
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Event Type</label>
                <select 
                  value={newEventType} 
                  onChange={e => setNewEventType(e.target.value as CalendarEvent['type'])}
                  className="w-full p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-premium-accent text-sm"
                >
                  {eventTypes.map(type => <option key={type} value={type} className="capitalize">{type}</option>)}
                </select>
              </div>
              <Button onClick={handleAddEvent} variant="primary" className="w-full">Add Event</Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};