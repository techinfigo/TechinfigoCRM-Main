
import React, { useState, useEffect, useRef, useMemo, useCallback, KeyboardEvent } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { Task, Project, TeamMember, TaskPriority, taskPriorities, TaskWorkflowStatus, taskWorkflowStatuses, Subtask, Comment, Activity, ActivityType, TaskReminderPrefs, TaskAttachment, TaskLink, ToastData } from '../../types';
import { Trash2, CheckCircle, Copy, Edit2, Plus, Edit, User, MessageSquare, ListChecks, History, Send, Trash, Eye, Users as UsersIcon, CalendarPlus, Bell, Paperclip, Link2, Upload, FileText, PlusCircle, CornerDownRight, ArrowUpRight, MoreVertical } from 'lucide-react';
import { Checkbox } from '../common/Checkbox';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { isValid } from 'date-fns';
import parseISO from 'date-fns/parseISO';

// --- HELPER FUNCTIONS ---
const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return '?';
    if (parts.length > 1) {
        return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
    }
    return (parts[0]?.[0] || '?').toUpperCase();
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Task) => void;
  onDelete: (taskId: string) => void;
  task?: Task | null;
  projects: Project[];
  teamMembers: TeamMember[];
  currentUser: TeamMember;
  onSetDirty: (isDirty: boolean) => void;
  taskNotFound?: boolean;
  showToast: (options: ToastData) => void;
  overrideZIndex?: string;
}

interface TaskFormData {
  title: string;
  description: string;
  projectId: string;
  assignedMemberId: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskWorkflowStatus;
  labels: string; // Comma-separated for input
}

const initialFormData: TaskFormData = {
  title: '',
  description: '',
  projectId: '',
  assignedMemberId: '',
  dueDate: '',
  priority: 'Medium',
  status: 'To Do',
  labels: '',
};

const initialReminderPrefs: TaskReminderPrefs = {
    enabled: false,
    leadTime: null,
};


export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen, onClose, onSave, onDelete, task, projects, teamMembers, currentUser, onSetDirty, taskNotFound, showToast, overrideZIndex
}) => {
  const [formData, setFormData] = useState<TaskFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<TaskFormData>>({});
  
  const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'comments' | 'activity' | 'attachments'>('details');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtask, setEditingSubtask] = useState<{ id: string; title: string } | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activityLog, setActivityLog] = useState<Activity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [watchers, setWatchers] = useState<string[]>([]);
  const [isWatcherDropdownOpen, setIsWatcherDropdownOpen] = useState(false);
  const [reminderPrefs, setReminderPrefs] = useState<TaskReminderPrefs>(initialReminderPrefs);
  
  // Attachments state
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [links, setLinks] = useState<TaskLink[]>([]);
  const [newLink, setNewLink] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Refs
  const titleInputRef = useRef<HTMLInputElement>(null);
  const newSubtaskInputRef = useRef<HTMLInputElement>(null);
  const initialFormStateRef = useRef<TaskFormData | null>(null);
  const watchersDropdownRef = useRef<HTMLDivElement>(null);
  
  // --- DATA LOADING & SAVING ---
  useEffect(() => {
    if (isOpen) {
      if (task) {
        const initialFormState = {
          title: task.title,
          description: task.description || '',
          projectId: task.projectId || '',
          assignedMemberId: task.assignedMemberId || '',
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
          priority: task.priority || 'Medium',
          status: task.status || 'To Do',
          labels: (task.labels || []).join(', '),
        };
        setFormData(initialFormState);
        setSubtasks(task.subtasks || []);
        setComments(task.comments || []);
        setActivityLog(task.activityLog || []);
        setWatchers(task.watchers || []);
        setReminderPrefs(task.reminderPrefs || initialReminderPrefs);
        setAttachments(task.attachments || []);
        setLinks(task.links || []);
        initialFormStateRef.current = JSON.parse(JSON.stringify(initialFormState)); // Deep copy for change tracking
      } else {
        const initialFormState = { ...initialFormData, projectId: projects[0]?.id || '', assignedMemberId: currentUser.id };
        setFormData(initialFormState);
        setSubtasks([]);
        setComments([]);
        setActivityLog([]);
        setWatchers([]);
        setReminderPrefs(initialReminderPrefs);
        setAttachments([]);
        setLinks([]);
        initialFormStateRef.current = JSON.parse(JSON.stringify(initialFormState));
      }
      onSetDirty(false);
      setErrors({});
      setActiveTab('details'); // Reset to details tab on open
      setTimeout(() => titleInputRef.current?.focus(), 100);
    } else {
        setNewComment('');
    }
  }, [isOpen, task, projects, currentUser.id, onSetDirty]);
  
  // Close watcher dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (watchersDropdownRef.current && !watchersDropdownRef.current.contains(event.target as Node)) {
        setIsWatcherDropdownOpen(false);
      }
    };
    if (isWatcherDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isWatcherDropdownOpen]);


  // --- ACTIVITY LOGGING ---
    const MAX_LOG_ENTRIES = 200;
    const addActivity = useCallback((message: string, meta?: Activity['meta']) => {
        const newActivity: Activity = {
            id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: 'edit',
            at: new Date().toISOString(),
            message: `${currentUser.name} ${message}`,
            meta,
        };
        setActivityLog(prevLog => {
            const updatedLog = [newActivity, ...prevLog];
            return updatedLog.length > MAX_LOG_ENTRIES ? updatedLog.slice(0, MAX_LOG_ENTRIES) : updatedLog;
        });
        onSetDirty(true);
    }, [currentUser.name, onSetDirty]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      onSetDirty(true);
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };
  
    const handleWatcherToggle = (memberId: string) => {
        onSetDirty(true);
        const member = teamMembers.find(tm => tm.id === memberId);
        if (!member) return;

        setWatchers(prev => {
            if (prev.includes(memberId)) {
                showToast({ title: 'Watcher Removed', description: `Removed ${member.name} as watcher` });
                addActivity(`removed ${member.name} as a watcher.`);
                return prev.filter(id => id !== memberId);
            } else {
                showToast({ title: 'Watcher Added', description: `Added ${member.name} as watcher` });
                addActivity(`added ${member.name} as a watcher.`);
                return [...prev, memberId];
            }
        });
    };


  // --- SUBTASK LOGIC ---
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const now = new Date().toISOString();
    const newSubtask: Subtask = { id: `sub-${Date.now()}`, title: newSubtaskTitle.trim(), done: false, createdAt: now, updatedAt: now };
    setSubtasks(prev => [newSubtask, ...prev]);
    addActivity(`added subtask "${newSubtaskTitle.trim()}".`);
    setNewSubtaskTitle('');
    newSubtaskInputRef.current?.focus();
  };
  const handleUpdateSubtask = (id: string, updates: Partial<Subtask>) => {
    const oldSubtask = subtasks.find(st => st.id === id);
    if(updates.done !== undefined && oldSubtask) addActivity(`marked subtask "${oldSubtask.title}" as ${updates.done ? 'done' : 'not done'}.`);
    setSubtasks(prev => prev.map(st => st.id === id ? { ...st, ...st, ...updates, updatedAt: new Date().toISOString() } : st));
  };
  const handleStartEditing = (subtask: Subtask) => setEditingSubtask({ id: subtask.id, title: subtask.title });
  const handleSaveSubtaskEdit = () => {
    if (editingSubtask && editingSubtask.title.trim()) {
        const oldSubtask = subtasks.find(st => st.id === editingSubtask.id);
        if(oldSubtask?.title !== editingSubtask.title.trim()) {
            addActivity(`renamed subtask from "${oldSubtask?.title}" to "${editingSubtask.title.trim()}".`);
        }
        handleUpdateSubtask(editingSubtask.id, { title: editingSubtask.title.trim() });
    }
    setEditingSubtask(null);
  };
  const handleDeleteSubtask = (id: string) => {
    if (window.confirm("Delete this subtask?")) {
        const subtaskToDelete = subtasks.find(st => st.id === id);
        if(subtaskToDelete) addActivity(`deleted subtask "${subtaskToDelete.title}".`);
        setSubtasks(prev => prev.filter(st => st.id !== id));
    }
  };

  // --- COMMENT LOGIC ---
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const newCommentObj: Comment = { id: `comm-${Date.now()}`, author: currentUser.name, text: newComment.trim(), createdAt: new Date().toISOString() };
    setComments(prev => [newCommentObj, ...prev]);
    addActivity('added a comment.');
    setNewComment('');
  };
  const handleCommentKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAddComment();
    }
  };
  const handleDeleteComment = (commentId: string) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        addActivity('removed a comment.');
    }
  };

  // --- ATTACHMENTS & LINKS LOGIC ---
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }; // Necessary to allow drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);
      const files = [...e.dataTransfer.files];
      handleFiles(files);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? [...e.target.files] : [];
      handleFiles(files);
      if(e.target) e.target.value = ''; // Reset file input
  };
  const handleFiles = (files: File[]) => {
      const newAttachments: TaskAttachment[] = files.map(file => ({
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type,
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
      addActivity(`attached ${newAttachments.length} file(s).`);
  };
  const handleDeleteAttachment = (id: string) => {
      const attachmentToDelete = attachments.find(a => a.id === id);
      if(attachmentToDelete) addActivity(`removed attachment "${attachmentToDelete.name}".`);
      setAttachments(prev => prev.filter(a => a.id !== id));
  };
  const handleAddLink = () => {
      try {
          const url = new URL(newLink.startsWith('http') ? newLink : `https://${newLink}`);
          const newLinkObj: TaskLink = { id: `link-${Date.now()}`, url: url.href };
          setLinks(prev => [...prev, newLinkObj]);
          addActivity(`added link: ${url.hostname}`);
          setNewLink('');
      } catch (error) {
          showToast({ title: 'Invalid URL', description: 'Please enter a valid link (e.g., https://example.com).' });
      }
  };
  const handleDeleteLink = (id: string) => {
      const linkToDelete = links.find(l => l.id === id);
      if(linkToDelete) addActivity(`removed link "${linkToDelete.url}".`);
      setLinks(prev => prev.filter(l => l.id !== id));
  };


  // --- .ICS Generation ---
  const generateIcsFile = () => {
    if (!task?.dueDate || !isValid(parseISO(task.dueDate))) {
        showToast({ title: 'Error', description: "A valid due date is required to create a calendar event." });
        return;
    }

    const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const formatDate = (date: Date) => date.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
    const escapeText = (text: string) => text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\n');

    const startDate = parseISO(task.dueDate);

    // VTIMEZONE component for IST for better client compatibility
    const vTimezone = [
        'BEGIN:VTIMEZONE',
        'TZID:Asia/Kolkata',
        'BEGIN:STANDARD',
        'DTSTART:19700101T000000',
        'TZOFFSETFROM:+0530',
        'TZOFFSETTO:+0530',
        'TZNAME:IST',
        'END:STANDARD',
        'END:VTIMEZONE'
    ].join('\r\n');

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//MyCRM//Task Reminder//EN',
        'X-WR-TIMEZONE:Asia/Kolkata', // Add timezone hint
        vTimezone, // Add VTIMEZONE definition
        'BEGIN:VEVENT',
        `UID:${task.id}@mycrm.app`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(startDate)}`, // DTSTART remains in UTC
        `DURATION:PT30M`,
        `SUMMARY:${escapeText(task.title)}`,
        `DESCRIPTION:${escapeText((task.description || '').substring(0, 200))}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${slugify(task.title)}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({ title: 'Success', description: "Calendar event file downloaded."});
  };

  // --- MAIN ACTIONS ---
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let finalActivityLog = [...activityLog];

        const createLogEntry = (message: string, meta?: Activity['meta']): Activity => ({
            id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: 'edit',
            at: new Date().toISOString(),
            message: `${currentUser.name} ${message}`,
            meta,
        });

        if (task) { // Diffing for existing task
            const changes: Activity[] = [];
            const findMemberName = (id?: string) => teamMembers.find(tm => tm.id === id)?.name || 'Unassigned';
            const formatDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString() : 'None';
            
            if (task.status !== formData.status) changes.push(createLogEntry(`changed status: ${task.status} → ${formData.status}.`));
            if (task.priority !== formData.priority) changes.push(createLogEntry(`changed priority: ${task.priority || 'N/A'} → ${formData.priority}.`));
            if (task.assignedMemberId !== formData.assignedMemberId) changes.push(createLogEntry(`reassigned task: ${findMemberName(task.assignedMemberId)} → ${findMemberName(formData.assignedMemberId)}.`));
            const oldDueDate = task.dueDate ? task.dueDate.split('T')[0] : '';
            if (oldDueDate !== formData.dueDate) changes.push(createLogEntry(`changed due date: ${formatDate(task.dueDate)} → ${formatDate(formData.dueDate)}.`));
            if (task.title !== formData.title) changes.push(createLogEntry(`renamed task to "${formData.title}".`));
            
            if (changes.length > 0) {
                finalActivityLog = [...changes.reverse(), ...finalActivityLog];
            }
        } else { // Creation log for new task
            finalActivityLog = [createLogEntry('created the task.')];
        }

        if (finalActivityLog.length > MAX_LOG_ENTRIES) {
            finalActivityLog = finalActivityLog.slice(0, MAX_LOG_ENTRIES);
        }

        onSave({
            ...(task || {}),
            ...formData,
            id: task?.id || `task-${Date.now()}`,
            labels: formData.labels.split(',').map(l => l.trim()).filter(Boolean),
            watchers,
            subtasks: subtasks,
            comments,
            activityLog: finalActivityLog,
            attachments,
            links,
            commentCount: comments.length,
            attachmentCount: attachments.length,
            linkCount: links.length,
        } as Task);
        onSetDirty(false);
    };

    const handleMarkDone = () => {
        if (!task) return;
        const newStatus = task.status === 'Done' ? 'To Do' : 'Done';
        addActivity(`changed status from "${task.status}" to "${newStatus}".`);
        onSave({ 
            ...task, 
            ...formData, 
            status: newStatus, 
            completed: newStatus === 'Done', 
            watchers,
            labels: formData.labels.split(',').map(l => l.trim()).filter(Boolean),
            subtasks: subtasks,
            comments,
            activityLog: activityLog,
            attachments,
            links,
            commentCount: comments.length,
            attachmentCount: attachments.length,
            linkCount: links.length,
        });
    };

    const handleDeleteClick = () => {
        if (task && window.confirm("Are you sure you want to delete this task?")) {
            onDelete(task.id);
        }
    };
    
    const handleCopyLink = () => {
        const url = new URL(window.location.href);
        url.search = `?taskId=${task?.id || ''}`;
        navigator.clipboard.writeText(url.toString())
            .then(() => showToast({ title: 'Success', description: 'Task link copied to clipboard!' }))
            .catch(() => showToast({ title: 'Error', description: 'Failed to copy link.' }));
    };

  // --- RENDER LOGIC ---
  const subtaskProgress = useMemo(() => subtasks.length === 0 ? 0 : (subtasks.filter(s => s.done).length / subtasks.length) * 100, [subtasks]);
  if (taskNotFound && isOpen) {
      return (
        <Modal isOpen={isOpen} onClose={onClose} title="Error" size="md">
            <div className="text-center p-4">
                <h3 className="text-lg font-semibold text-status-negative">Task Not Found</h3>
                <p className="mt-2 text-sm text-text-muted">
                    The task you are looking for might have been deleted or moved.
                </p>
                <Button onClick={onClose} className="mt-4">
                    Close
                </Button>
            </div>
        </Modal>
      );
  }
  
    const assignee = useMemo(() => teamMembers.find(tm => tm.id === formData.assignedMemberId), [formData.assignedMemberId, teamMembers]);
    const watcherMembers = useMemo(() => teamMembers.filter(tm => watchers.includes(tm.id)), [watchers, teamMembers]);

    const Avatar: React.FC<{ member?: TeamMember, size?: 'sm' | 'md' }> = ({ member, size = 'md' }) => {
        if (!member) return null;
        const sizeClass = size === 'md' ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-xs';
        return (
            <div title={member.name} className={`rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center font-bold text-premium-accent shrink-0 overflow-hidden ${sizeClass}`}>
                {member.profilePictureUrl ? <img src={member.profilePictureUrl} alt={member.name} className="w-full h-full object-cover"/> : getInitials(member.name)}
            </div>
        );
    };

    const modalTitle = (
        <div className="flex flex-col">
            <span className="text-lg font-semibold">{formData.title || "New Task"}</span>
            <span className="text-xs text-text-muted">in project: {projects.find(p => p.id === formData.projectId)?.name || 'Global Tasks'}</span>
        </div>
    );
  
  const selectBaseClass = "w-full p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="4xl" overrideZIndex={overrideZIndex}
      footer={
        <div className="w-full flex justify-between items-center">
            <div>{task && (<div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={handleMarkDone} leftIcon={<CheckCircle size={16}/>}>{task.status === 'Done' ? 'Mark Undone' : 'Mark Done'}</Button><Button variant="ghost" size="sm" onClick={handleCopyLink} leftIcon={<Copy size={16}/>}>Copy Link</Button><Button variant="danger" size="sm" onClick={handleDeleteClick} leftIcon={<Trash2 size={16} />}>Delete</Button></div>)}</div>
            <div className="flex items-center gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={handleSubmit} disabled={!formData.title.trim()}>{task ? 'Save Changes' : 'Add Task'}</Button></div>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
            <Input ref={titleInputRef} name="title" value={formData.title} onChange={handleChange} error={errors.title} placeholder="Task Title..." className="!text-lg !font-semibold !p-2 !border-0 focus:!ring-0 !shadow-none"/>
            <TextArea name="description" value={formData.description} onChange={handleChange} rows={5} placeholder="Add a description..."/>
            {task && (
                <>
                <div className="pt-3 border-t border-border-base dark:border-slate-700">
                    <h3 className="text-md font-semibold text-text-heading flex items-center gap-2"><Paperclip size={18}/> Attachments & Links</h3>
                    <div className="space-y-4 mt-2">
                        <div>
                            <div 
                                onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
                                onClick={() => attachmentInputRef.current?.click()}
                                className={`p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDraggingOver ? 'border-premium-accent bg-premium-accent-light dark:bg-premium-accent-dark/20' : 'border-border-base dark:border-slate-600 hover:border-premium-accent'}`}
                            >
                                <Upload size={20} className="mx-auto text-text-muted"/>
                                <p className="mt-1 text-sm text-text-muted">Drag & drop files, or click to browse.</p>
                                <p className="text-xs text-text-muted">(Local only, no upload will occur)</p>
                                <input type="file" multiple ref={attachmentInputRef} onChange={handleFileSelect} className="hidden" />
                            </div>
                            <div className="mt-2 space-y-1">
                                {attachments.map(file => (
                                    <div key={file.id} className="flex items-center justify-between p-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-md text-xs">
                                        <div className="flex items-center gap-2 min-w-0"><FileText size={14} className="text-text-muted flex-shrink-0"/><p className="font-medium truncate" title={file.name}>{file.name}</p><p className="text-text-muted shrink-0">({formatFileSize(file.size)})</p></div>
                                        <Button variant="ghost" size="xs" className="!p-1 text-red-500" onClick={() => handleDeleteAttachment(file.id)}><Trash size={14}/></Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                             <div className="flex gap-2">
                                <Input value={newLink} onChange={e => setNewLink(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddLink()} placeholder="https://example.com" containerClassName="flex-grow" />
                                <Button onClick={handleAddLink} disabled={!newLink.trim()}>Add Link</Button>
                            </div>
                            <div className="mt-2 space-y-1">
                                {links.map(link => {
                                    const hostname = new URL(link.url).hostname;
                                    return (
                                        <div key={link.id} className="flex items-center justify-between p-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-md text-xs">
                                            <div className="flex items-center gap-2 min-w-0"><img src={`https://www.google.com/s2/favicons?sz=16&domain_url=${hostname}`} alt="favicon" className="w-4 h-4"/><a href={link.url} target="_blank" rel="noopener noreferrer" className="font-medium truncate hover:underline text-blue-600 dark:text-blue-400" title={link.url}>{link.url}</a></div>
                                            <Button variant="ghost" size="xs" className="!p-1 text-red-500" onClick={() => handleDeleteLink(link.id)}><Trash size={14}/></Button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-3 border-t border-border-base dark:border-slate-700">
                    <h3 className="text-md font-semibold text-text-heading flex items-center gap-2"><ListChecks size={18}/> Subtasks</h3>
                    {subtasks.length > 0 && <div className="flex items-center gap-2 my-2"><div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"><div className="bg-status-positive h-2 rounded-full transition-all" style={{ width: `${subtaskProgress}%` }}></div></div><span className="text-xs font-semibold text-text-muted">{subtaskProgress.toFixed(0)}%</span></div>}
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 -mr-2">
                        {subtasks.map(st => (
                            <div key={st.id} className="flex items-center gap-2 group p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50">
                                <Checkbox checked={st.done} onChange={(e) => handleUpdateSubtask(st.id, { done: e.target.checked })} id={`subtask-${st.id}`} />
                                <div className="flex-1">
                                    {editingSubtask?.id === st.id ? (<Input value={editingSubtask.title} onChange={(e) => setEditingSubtask({...editingSubtask, title: e.target.value})} onBlur={handleSaveSubtaskEdit} onKeyDown={(e) => {if (e.key === 'Enter') handleSaveSubtaskEdit(); if(e.key === 'Escape') setEditingSubtask(null);}} autoFocus className="!text-sm !p-1" />) : (<label htmlFor={`subtask-${st.id}`} className={`text-sm cursor-pointer ${st.done ? 'line-through text-text-muted' : ''}`}>{st.title}</label>)}
                                </div>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="ghost" size="xs" className="!p-1" onClick={() => handleStartEditing(st)}><Edit2 size={14}/></Button><Button variant="ghost" size="xs" className="!p-1 text-red-500" onClick={() => handleDeleteSubtask(st.id)}><Trash2 size={14}/></Button></div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 mt-2"><Input ref={newSubtaskInputRef} value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} onKeyDown={(e) => {if(e.key === 'Enter') {e.preventDefault(); handleAddSubtask();}}} placeholder="Add an item" containerClassName="flex-grow"/><Button onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()} size="sm">Add</Button></div>
                </div>
                </>
            )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4 pt-2">
            <div><label className="text-xs font-semibold uppercase text-text-muted">Status</label><select name="status" value={formData.status} onChange={handleChange} className={`${selectBaseClass} mt-1`}><option value="">--</option>{taskWorkflowStatuses.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="text-xs font-semibold uppercase text-text-muted">Assignee</label><select name="assignedMemberId" value={formData.assignedMemberId} onChange={handleChange} className={`${selectBaseClass} mt-1`}><option value="">Unassigned</option>{teamMembers.map(tm=><option key={tm.id} value={tm.id}>{tm.name}</option>)}</select></div>
            <div><label className="text-xs font-semibold uppercase text-text-muted">Project</label><select name="projectId" value={formData.projectId} onChange={handleChange} className={`${selectBaseClass} mt-1`}><option value="">Global</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="text-xs font-semibold uppercase text-text-muted">Due Date</label><Input name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} className="mt-1"/></div>
            <div><label className="text-xs font-semibold uppercase text-text-muted">Priority</label><select name="priority" value={formData.priority} onChange={handleChange} className={`${selectBaseClass} mt-1`}><option value="">--</option>{taskPriorities.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
            
            {task && (
              <div className="pt-3 border-t border-border-base dark:border-slate-700">
                  <h4 className="text-xs font-semibold uppercase text-text-muted mb-2">Reminders & Calendar</h4>
                  <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                      <ToggleSwitch id={`reminders-enabled-${task.id}`} label="Enable Reminder" checked={reminderPrefs.enabled} onChange={c => setReminderPrefs(p => ({...p, enabled: c}))} />
                      {reminderPrefs.enabled && (
                          <select name="leadTime" value={reminderPrefs.leadTime || ''} onChange={e => setReminderPrefs(p => ({...p, leadTime: e.target.value as any || null}))} className={`${selectBaseClass} !text-xs`}>
                              <option value="">No specific lead time</option>
                              <option value="30m">30 minutes before</option>
                              <option value="2h">2 hours before</option>
                              <option value="1d">1 day before</option>
                          </select>
                      )}
                      <div title={!formData.dueDate ? "Set a due date to add to calendar" : "Download .ics file"}>
                        <Button
                            variant="outline"
                            size="xs"
                            onClick={generateIcsFile}
                            leftIcon={<CalendarPlus size={14}/>}
                            disabled={!formData.dueDate}
                            className={`w-full ${!formData.dueDate ? 'cursor-not-allowed' : ''}`}
                        >
                            Add to Calendar (.ics)
                        </Button>
                      </div>
                  </div>
              </div>
            )}
        </div>
      </div>
    </Modal>
  );
};
