import React from 'react';
import { Button } from '../common/Button';

interface QuickActionsProps {
  onOpenLeadFormModal: () => void;
  onOpenClientFormModal: () => void;
  onOpenProjectFormModal: () => void;
  onOpenInvoiceModal: () => void;
  onOpenExpenseModal: () => void;
  onOpenPaymentModal: () => void;
  onOpenTaskModal: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = (props) => {
    const actions = [
        { label: 'Add Lead', handler: props.onOpenLeadFormModal },
        { label: 'Add Client', handler: props.onOpenClientFormModal },
        { label: 'New Project', handler: props.onOpenProjectFormModal },
        { label: 'Add Task', handler: props.onOpenTaskModal },
        { label: 'New Invoice', handler: props.onOpenInvoiceModal },
        { label: 'Add Expense', handler: props.onOpenExpenseModal },
        { label: 'Add Payment', handler: props.onOpenPaymentModal },
    ];
    return (
        <div className="bg-bg-base dark:bg-bg-base p-4 rounded-2xl shadow-lg border border-border-base dark:border-border-muted">
            <div className="flex items-center flex-wrap gap-2">
                <span className="text-sm font-semibold text-text-muted dark:text-text-muted mr-2">Quick Actions:</span>
                {actions.map(action => (
                    <Button key={action.label} onClick={() => action.handler()} variant="secondary" size="sm">
                        {action.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}