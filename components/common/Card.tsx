
import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface CardProps extends Omit<HTMLMotionProps<"div">, 'title'> {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  titleClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  icon?: React.ReactNode; 
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  title, 
  children, 
  className, 
  actions, 
  titleClassName, 
  contentClassName, 
  headerClassName, 
  icon, 
  noPadding = false,
  ...rest 
}) => {
  return (
    <motion.div 
      layout
      className={`bg-white dark:bg-zinc-900 rounded-2xl shadow-sm hover:shadow-md border border-zinc-100 dark:border-zinc-800 transition-shadow duration-300 overflow-hidden ${className || ''}`} 
      {...rest}
    >
      {(title || icon || actions) && ( 
        <div className={`px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900/50 ${headerClassName || ''}`}>
          <div className="flex items-center min-w-0">
            {icon && <span className="mr-3 h-5 w-5 text-zinc-400 dark:text-zinc-500 shrink-0">{icon}</span>}
            {title && (typeof title === 'string' 
                ? <h3 className={`text-sm md:text-base font-bold text-zinc-800 dark:text-zinc-100 truncate tracking-tight ${titleClassName || ''}`}>{title}</h3>
                : title
            )}
          </div>
          {actions && <div className="ml-3 shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`${noPadding ? '' : 'p-5'} ${contentClassName || 'text-zinc-600 dark:text-zinc-300'}`}>
        {children}
      </div>
    </motion.div>
  );
};
