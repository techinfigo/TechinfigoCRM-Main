import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Task, Project } from '../../types';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, FolderKanban, ClipboardList, X } from 'lucide-react';

type SearchResult = ((Task & { projectName?: string }) & { resultType: 'task' }) | (Project & { resultType: 'project' });

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: (Task & { projectName?: string, assigneeName?: string })[];
  projects: Project[];
  onSelectTask: (task: Task) => void;
  onSelectProject: (project: Project) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, tasks, projects, onSelectTask, onSelectProject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 200);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (debouncedSearchTerm.trim() === '') {
      const recentTasks = [...tasks]
        .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
        .slice(0, 5)
        .map(t => ({ ...t, resultType: 'task' as const }));

      const recentProjects = [...projects]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 5)
        .map(p => ({ ...p, resultType: 'project' as const }));
        
      setResults([...recentTasks, ...recentProjects].slice(0, 10));
    } else {
      const lowerSearch = debouncedSearchTerm.toLowerCase();

      const taskResults = tasks
        .filter(t => 
          t.title.toLowerCase().includes(lowerSearch) ||
          t.projectName?.toLowerCase().includes(lowerSearch) ||
          t.assigneeName?.toLowerCase().includes(lowerSearch)
        )
        .map(t => ({ ...t, resultType: 'task' as const }));

      const projectResults = projects
        .filter(p => 
          p.name.toLowerCase().includes(lowerSearch) ||
          p.clientName.toLowerCase().includes(lowerSearch) ||
          p.tags?.some(tag => tag.toLowerCase().includes(lowerSearch))
        )
        .map(p => ({ ...p, resultType: 'project' as const }));

      setResults([...projectResults, ...taskResults].slice(0, 20));
    }
    setSelectedIndex(0);
  }, [debouncedSearchTerm, tasks, projects, isOpen]);
  
  const handleSelect = useCallback((index: number) => {
    const selected = results[index];
    if (selected) {
      if (selected.resultType === 'task') {
        onSelectTask(selected);
      } else {
        onSelectProject(selected);
      }
      onClose();
    }
  }, [results, onSelectTask, onSelectProject, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (results.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (results.length || 1)) % (results.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelect(selectedIndex);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, handleSelect, onClose]);

  useEffect(() => {
    listRef.current?.children[selectedIndex]?.scrollIntoView({
      block: 'nearest',
    });
  }, [selectedIndex]);
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[1000] flex justify-center pt-20 transition-opacity duration-300 ease-in-out print:hidden animate-content-fade-in"
      onClick={onClose}
    >
      <style>{`
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          @keyframes scale-in { from { transform: scale(0.95) translateY(-10px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
      `}</style>
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="bg-bg-base dark:bg-bg-muted rounded-xl shadow-2xl w-full max-w-2xl max-h-[60vh] flex flex-col overflow-hidden border border-border-muted dark:border-border-muted animate-[scale-in_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="p-4 border-b border-border-base dark:border-border-muted flex items-center gap-3">
          <Search className="w-5 h-5 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks, projects, clients..."
            className="w-full bg-transparent focus:outline-none text-text-base dark:text-text-base text-lg"
            role="combobox"
            aria-expanded={true}
            aria-controls="command-palette-results"
            aria-autocomplete="list"
          />
           <button onClick={onClose} className="text-text-muted hover:text-text-base" aria-label="Close command palette"><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {results.length > 0 ? (
            <div className="p-2">
              <h3 className="px-2 py-1 text-xs font-semibold text-text-muted uppercase tracking-wider">{debouncedSearchTerm ? 'Results' : 'Recent'}</h3>
              <ul id="command-palette-results" role="listbox" ref={listRef} className="mt-1">
                {results.map((item, index) => (
                  <li
                    key={`${item.resultType}-${item.id}`}
                    id={`result-item-${index}`}
                    role="option"
                    aria-selected={selectedIndex === index}
                    onClick={() => handleSelect(index)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${selectedIndex === index ? 'bg-secondary-accent/10 text-secondary-accent' : 'text-text-base dark:text-text-base'}`}
                  >
                    <div className="flex-shrink-0 w-5 h-5">
                      {item.resultType === 'task' ? <ClipboardList size={18} /> : <FolderKanban size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${selectedIndex === index ? 'text-secondary-accent' : 'text-text-heading'}`}>
                        {item.resultType === 'task' ? item.title : item.name}
                      </p>
                      <p className={`text-xs truncate ${selectedIndex === index ? 'text-secondary-accent/80' : 'text-text-muted'}`}>
                        {item.resultType === 'task' ? `Task in ${item.projectName || 'Global'}` : `Project for ${item.clientName}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-8 text-center text-text-muted">
              <p>No results found for "{debouncedSearchTerm}"</p>
            </div>
          )}
        </div>
        <div className="p-2 border-t border-border-base dark:border-border-muted text-xs text-text-muted flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
          <span>&uarr;&darr; to navigate</span>
          <span>&#9166; to select</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
};