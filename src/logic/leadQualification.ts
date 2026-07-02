
import { Lead, LeadFit, BudgetReadiness, LeadStatus } from '../types';

/**
 * Calculates the Lead Fit score based on Revenue and Ad Status.
 * Rules:
 * - Low Fit: Revenue < $10k
 * - Medium Fit: Revenue $10k-$50k + Inactive Ads
 * - High Fit: Revenue $50k+ OR ($10k-$50k + Active Ads)
 */
export const calculateLeadFit = (lead: Partial<Lead>): LeadFit => {
    const revenue = lead.revenueBand;
    const adStatus = lead.adStatus;

    if (!revenue || revenue === "<$10k/mo") {
        return 'Low Fit';
    }

    if (revenue === "$10k - $50k/mo") {
        return adStatus === 'Active' ? 'High Fit' : 'Medium Fit';
    }

    if (revenue === "$50k - $100k/mo" || revenue === "$100k+/mo") {
        return 'High Fit';
    }

    return 'Low Fit'; // Default fallback
};

/**
 * Determines if the lead has the budget based on estimated budget string.
 */
export const calculateBudgetReadiness = (estimatedBudget?: string): BudgetReadiness => {
    if (!estimatedBudget) return 'Not Ready';
    
    // Extract numbers from string like "$1,000 - $5,000"
    const numbers = estimatedBudget.match(/(\d+)/g);
    if (!numbers) return 'Not Ready';
    
    const maxBudget = Math.max(...numbers.map(n => parseInt(n, 10)));
    
    // Thresholds (Example: Minimum retainer $1000)
    if (maxBudget < 1000) return 'Not Ready';
    if (maxBudget < 3000) return 'Partially Ready';
    return 'Ready';
};

/**
 * Checks if all required fields for qualification are present.
 */
export const checkQualificationComplete = (lead: Partial<Lead>): boolean => {
    return !!(
        lead.revenueBand && 
        lead.adStatus && 
        lead.website
    );
};

/**
 * Returns a color class for the fit label.
 */
export const getFitColor = (fit?: LeadFit): string => {
    switch (fit) {
        case 'High Fit': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
        case 'Medium Fit': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
        default: return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
    }
};

/**
 * Validates if a status transition is allowed based on Lead Fit.
 */
export const validateStatusTransition = (lead: Lead, newStatus: LeadStatus): { allowed: boolean; reason?: string } => {
    // Rule: Cannot move to 'Qualified' if data is missing
    if (newStatus === 'Qualified' && !lead.qualificationCompleted) {
        return { allowed: false, reason: "Lead must have Revenue, Ad Status, and Website filled to be Qualified." };
    }

    // Rule: Cannot move to 'Audit in Progress' if Low Fit
    if ((newStatus === 'Audit in Progress' || newStatus === 'Pitch Scheduled') && lead.leadFit === 'Low Fit') {
        return { allowed: false, reason: "Audit is blocked for Low Fit leads. Archive or nurture instead." };
    }

    // Rule: Cannot move to 'Closed Won' without a Proposal (conceptual check)
    // if (newStatus === 'Closed Won' && lead.status !== 'Negotiation') ...

    return { allowed: true };
};
