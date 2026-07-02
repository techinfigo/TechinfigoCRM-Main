
import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleButtonProps {
  currentTheme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ currentTheme, onToggleTheme }) => {
  const isDark = currentTheme === 'dark';

  return (
    <button
      onClick={onToggleTheme}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="relative p-2 rounded-full text-text-muted dark:text-gray-300 hover:text-secondary-accent dark:hover:text-secondary-accent transition-colors duration-200 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-accent dark:focus:ring-offset-bg-muted w-9 h-9 flex items-center justify-center overflow-hidden"
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className={`absolute transition-all duration-300 ease-in-out ${isDark ? 'transform -rotate-90 scale-0' : 'transform rotate-0 scale-100'}`}>
        <Sun className="w-5 h-5 text-yellow-500" />
      </div>
      <div className={`absolute transition-all duration-300 ease-in-out ${isDark ? 'transform rotate-0 scale-100' : 'transform rotate-90 scale-0'}`}>
         <Moon className="w-5 h-5 text-slate-400" />
      </div>
    </button>
  );
};
