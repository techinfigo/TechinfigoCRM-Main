
import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ImportSummary } from '../../types';

interface ImportConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (mode: 'replace' | 'merge') => void;
  summary: ImportSummary;
}

const getFriendlyName = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
};

export const ImportConfirmationModal: React.FC<ImportConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirmImport,
  summary,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Data Import"
      size="xl"
      overrideZIndex="z-[2000]"
      footer={
        <div className="w-full flex justify-between items-center">
            <p className="text-xs text-text-muted">Version: {summary.data.version}</p>
            <div className="flex gap-2">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={() => onConfirmImport('merge')}>
                    Merge with Existing Data
                </Button>
                 <Button variant="danger" onClick={() => onConfirmImport('replace')}>
                    Replace All Data
                </Button>
            </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Warning: This action is irreversible.</h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            <strong>Replace:</strong> All current CRM data will be permanently deleted and replaced by the data in this backup file.
            <br />
            <strong>Merge:</strong> The backup data will be added to your current data. Existing items with the same ID will be updated.
          </p>
        </div>
        <div>
            <h4 className="font-semibold text-text-base dark:text-text-base mb-2">Backup File Summary:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                {Object.entries(summary.counts).map(([key, count]) => (
                    (count as number) > 0 && (
                        <div key={key} className="text-sm">
                            <span className="font-medium text-text-base dark:text-slate-200">{getFriendlyName(key)}:</span>
                            <span className="ml-1.5 text-text-muted dark:text-slate-300">{count}</span>
                        </div>
                    )
                ))}
            </div>
        </div>
        <p className="text-sm text-center text-text-muted dark:text-slate-400">Please choose how you would like to import the data.</p>
      </div>
    </Modal>
  );
};
