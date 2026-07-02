
import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AlertTriangle, Trash2, Info, AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void; // Called when "Cancel" is clicked or modal is closed externally
  onConfirm: () => void; // Called when action is confirmed
  title?: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  overrideZIndex?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = 'danger',
  overrideZIndex
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
        case 'danger': return <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />;
        case 'warning': return <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
        default: return <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getBgColor = () => {
    switch (variant) {
        case 'danger': return 'bg-red-100 dark:bg-red-900/30';
        case 'warning': return 'bg-amber-100 dark:bg-amber-900/30';
        default: return 'bg-blue-100 dark:bg-blue-900/30';
    }
  };

  const titleContent = (
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full shrink-0 flex items-center justify-center ${getBgColor()}`}>
            {getIcon()}
        </div>
        <span className="text-lg font-bold text-slate-900 dark:text-white">{title}</span>
      </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titleContent}
      size="md"
      overrideZIndex={overrideZIndex}
      footer={
        <div className="flex w-full gap-3 sm:justify-end">
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto justify-center">
            {cancelLabel}
          </Button>
          <Button 
            variant={variant === 'danger' ? "danger" : "primary"} 
            onClick={onConfirm}
            className="w-full sm:w-auto justify-center"
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="py-2">
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {message}
        </div>
      </div>
    </Modal>
  );
};
