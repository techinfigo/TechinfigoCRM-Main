import React, { useState } from 'react';
import { DiagnosticLog } from '../../types';

// Self-contained icons
const BugIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v.512c.387.086.76.208 1.126.368l.892-.318a.75.75 0 11.53 1.424l-.318.892c.16.366.282.74.368 1.126h.512a.75.75 0 010 1.5h-.512c-.086.387-.208.76-.368 1.126l.318.892a.75.75 0 11-1.424.53l-.892-.318a4.493 4.493 0 01-1.126.368v.512a.75.75 0 01-1.5 0v-.512a4.493 4.493 0 01-1.126-.368l-.892.318a.75.75 0 11-.53-1.424l.318-.892a4.493 4.493 0 01-.368-1.126H3.75a.75.75 0 010-1.5h.512c.086-.387.208-.76.368-1.126l-.318-.892a.75.75 0 011.424-.53l.892.318c.366-.16.74-.282 1.126-.368V2.75A.75.75 0 0110 2zM6.56 8.44a.75.75 0 00-1.12 0L4.375 9.505a.75.75 0 000 1.121l1.065 1.065a.75.75 0 101.06-1.06l-.53-.531.53-.53a.75.75 0 000-1.121zm6.88-1.06a.75.75 0 00-1.06 0l-.53.53.53.53a.75.75 0 001.06 1.06l1.065-1.065a.75.75 0 000-1.121L13.44 8.44z" clipRule="evenodd" /></svg>;
const XMarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>;

interface DiagnosticsConsoleProps {
  logs: DiagnosticLog[];
}

export const DiagnosticsConsole: React.FC<DiagnosticsConsoleProps> = ({ logs }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getLogColor = (type: DiagnosticLog['type']) => {
    switch (type) {
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-4 right-4 z-[9000] w-12 h-12 bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-muted focus:ring-secondary-accent"
        aria-label="Toggle diagnostics console"
        aria-expanded={isOpen}
      >
        <BugIcon />
      </button>

      {isOpen && (
        <div
          role="log"
          className="fixed bottom-20 right-4 z-[9000] w-96 max-h-80 bg-gray-900/90 backdrop-blur-sm text-white rounded-lg shadow-2xl border border-gray-700 flex flex-col animate-content-fade-in"
        >
          <header className="flex justify-between items-center p-2 border-b border-gray-700">
            <h3 className="font-semibold text-sm">Diagnostics Console</h3>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-700">
              <XMarkIcon />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-2">
            {logs.length > 0 ? (
              <ul className="space-y-1.5 text-xs font-mono">
                {logs.map((log, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-gray-500 flex-shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`${getLogColor(log.type)}`}>
                      {log.message}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-sm text-gray-500 p-4">No diagnostic logs yet.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};