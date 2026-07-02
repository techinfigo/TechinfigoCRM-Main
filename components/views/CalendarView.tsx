
import React, { useState, useMemo, useCallback } from 'react';
import { Project, Invoice, Lead, Task, CalendarEvent, MarketingAuditRequest, CampaignAnomaly, LeaveRequest } from '../../types'; // Updated imports
import { calendarEventColors } from '../../constants';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { CalendarModal } from '@/components/calendar/CalendarModal';

interface CalendarViewProps {
  projects: Project[];
  invoices: Invoice[];
  leads: Lead[];
  marketingAudits: MarketingAuditRequest[]; 
  campaignAnomalies?: CampaignAnomaly[]; 
  leaveRequests: LeaveRequest[];
}

const ArrowLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M11.78 5.22a.75.75 0 010 1.06L8.06 10l3.72 3.72a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z" clipRule="evenodd" /></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>;

export const CalendarView: React.FC<CalendarViewProps> = ({ projects, invoices, leads, marketingAudits, campaignAnomalies = [], leaveRequests }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const allCalendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];
    projects.forEach(p => {
      if (p.deadline) events.push({ id: `proj-${p.id}`, date: new Date(p.deadline), title: p.name, type: 'project', originalItem: p, colorClass: calendarEventColors.project });
      p.tasks.forEach(t => {
        if (t.dueDate) events.push({ id: `task-${t.id}`, date: new Date(t.dueDate), title: t.title, type: 'task', originalItem: t, colorClass: calendarEventColors.task });
      });
    });
    invoices.forEach(i => {
      if (i.dueDate) events.push({ id: `inv-${i.id}`, date: new Date(i.dueDate), title: `Inv #${i.invoiceNumber} Due`, type: 'invoice', originalItem: i, colorClass: calendarEventColors.invoice });
    });
    leads.forEach(l => {
      if (l.nextFollowUpDateTime) events.push({ id: `lead-${l.id}`, date: new Date(l.nextFollowUpDateTime), title: `Follow up: ${l.name}`, type: 'lead', originalItem: l, colorClass: calendarEventColors.lead });
    });
    marketingAudits.forEach(audit => {
      events.push({ id: `audit-${audit.id}`, date: new Date(audit.dateRequested), title: `Audit: ${audit.websiteUrl}`, type: 'audit', originalItem: audit, colorClass: calendarEventColors.audit });
    });
    campaignAnomalies.forEach(anomaly => {
      events.push({ id: `anomaly-${anomaly.id}`, date: new Date(anomaly.date), title: `Anomaly: ${anomaly.campaignName}`, type: 'anomaly', originalItem: anomaly, colorClass: calendarEventColors.anomaly });
    });
    leaveRequests.forEach(lr => {
      if (lr.status === 'Approved') {
        const startDate = new Date(new Date(lr.startDate).setUTCHours(0,0,0,0));
        const endDate = new Date(new Date(lr.endDate).setUTCHours(0,0,0,0));
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          events.push({ id: `leave-${lr.id}-${d.toISOString().split('T')[0]}`, date: new Date(d), title: `${lr.memberName} - ${lr.leaveType}`, type: 'leave', originalItem: lr, colorClass: calendarEventColors.leave });
        }
      }
    });
    return events;
  }, [projects, invoices, leads, marketingAudits, campaignAnomalies, leaveRequests]);
  
  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsModalOpen(true);
  };
  
  const handleAddEvent = (event: Omit<CalendarEvent, 'id' | 'originalItem' | 'colorClass'>) => {
      // In a real app, this would update state via a callback to App.tsx or use a context.
      // For this demo, we'll just log it.
      alert(`Conceptual: Adding new event "${event.title}" on ${event.date.toLocaleDateString()}`);
      console.log("New Event Added:", event);
      setIsModalOpen(false);
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  }, []);

  const { daysInMonth, month, year } = useMemo(() => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const days: (Date | null)[] = [];
    const startDayOfWeek = firstDayOfMonth.getDay();
    const numDays = lastDayOfMonth.getDate();

    for (let i = 0; i < startDayOfWeek; i++) { days.push(null); }
    for (let i = 1; i <= numDays; i++) { days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i)); }
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) { days.push(null); }
    
    return { daysInMonth: days, month: currentDate.getMonth(), year: currentDate.getFullYear() };
  }, [currentDate]);

  return (
    <div className="h-full flex flex-col">
      <Card 
        title={
            <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-text-heading dark:text-text-heading">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                     <Button onClick={() => setCurrentDate(new Date())} variant="outline" size="sm" className="hidden sm:block">Today</Button>
                </div>
                <div className="flex items-center gap-1">
                    <Button onClick={() => changeMonth(-1)} variant="ghost" size="sm" className="p-2" aria-label="Previous month"><ArrowLeftIcon /></Button>
                    <Button onClick={() => changeMonth(1)} variant="ghost" size="sm" className="p-2" aria-label="Next month"><ArrowRightIcon /></Button>
                </div>
            </div>
        } 
        className="bg-stone-50/50 dark:bg-slate-900/40 shadow-xl rounded-2xl flex flex-col flex-grow overflow-hidden"
        contentClassName="flex-grow flex flex-col p-2 md:p-3 overflow-hidden"
        headerClassName="bg-white/80 dark:bg-bg-base/80 backdrop-blur-sm"
      >
        <div key={currentDate.toISOString()} className="animate-[fade-in_0.5s_ease-out] flex-grow flex flex-col overflow-y-auto custom-scrollbar">
          <CalendarGrid
            days={daysInMonth}
            events={allCalendarEvents}
            today={today}
            currentMonth={month}
            onDayClick={handleDayClick}
          />
        </div>
      </Card>
      
      {isModalOpen && selectedDate && (
        <CalendarModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          date={selectedDate}
          events={allCalendarEvents.filter(event => new Date(event.date).toDateString() === selectedDate.toDateString())}
          onAddEvent={handleAddEvent}
        />
      )}
    </div>
  );
};
