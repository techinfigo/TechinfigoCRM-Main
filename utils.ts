// FIX: Changed `parseISO` to be a default import from `date-fns/parseISO` to resolve module export error.
import { format, formatDistanceToNowStrict, isValid, differenceInCalendarDays, isToday, isYesterday, isTomorrow } from 'date-fns';
import parseISO from 'date-fns/parseISO';
// FIX: Revert to a named import, supported by an updated import map.
// FIX: The function `utcToZonedTime` is deprecated. Use `toZonedTime` instead.
import { toZonedTime } from 'date-fns-tz';
import { t } from '@/i18n';

/**
 * Debounce utility to limit the rate at which a function can fire.
 */
export const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>): void => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => func(...args), waitFor);
    };
};

/**
 * Helper to parse a date string, assuming UTC for date-only strings (YYYY-MM-DD).
 * @param dateString The ISO or YYYY-MM-DD date string.
 * @returns A Date object or null if invalid.
 */
const parseDateStringAsUtc = (dateString?: string): Date | null => {
    if (!dateString) return null;
    // Handles YYYY-MM-DD by assuming UTC midnight, and full ISO strings correctly.
    const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00.000Z`);
    return isValid(date) ? date : null;
};


/**
 * Safely formats a date string, returning a fallback for invalid dates.
 * This version is improved to handle timezone offsets for date-only strings.
 * @param dateString The ISO date string.
 * @param formatStr The date-fns format string (e.g., 'PP', 'MMM d').
 * @returns The formatted date string or a localized fallback.
 */
export const safeFormatDate = (dateString?: string, formatStr: string = 'PP'): string => {
    if (!dateString) return t('common.na');
    try {
        const date = parseDateStringAsUtc(dateString);
        if (!date) return t('dates.invalid');
        
        // Display date in the target timezone to avoid day-off errors
        // FIX: The function `utcToZonedTime` is deprecated. Use `toZonedTime` instead.
        const zonedDate = toZonedTime(date, 'Asia/Kolkata');
        return format(zonedDate, formatStr);
    } catch (e) {
        console.error(`Date formatting error for "${dateString}":`, e);
        return t('dates.invalid');
    }
};

/**
 * Safely formats a number as currency.
 * @param amount The number to format.
 * @param currencyCode The currency code (e.g., 'INR', 'USD').
 * @returns The formatted currency string.
 */
export const safeFormatCurrency = (amount: number, currencyCode: string = 'INR'): string => {
    try {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currencyCode }).format(amount);
    } catch (e) {
        console.error(`Failed to format currency for amount ${amount} with code ${currencyCode}`, e);
        return String(amount);
    }
};

/**
 * Safely formats a date string into smart relative time from now (e.g., "yesterday", "in 5 minutes").
 * @param isoString The ISO date string.
 * @returns The relative time string or a localized fallback.
 */
export const safeFormatRelativeTime = (isoString?: string): string => {
    if (!isoString) return t('common.na');
    try {
        const date = parseISO(isoString);
        if (!isValid(date)) return t('dates.invalid');

        const now = new Date();
        const daysDiff = differenceInCalendarDays(date, now);

        if (daysDiff === 0) return t('dates.today');
        if (daysDiff === 1) return t('dates.tomorrow');
        if (daysDiff === -1) return t('dates.yesterday');
        
        return formatDistanceToNowStrict(date, { addSuffix: true });
    } catch (e) {
        console.error(`Relative date formatting error for "${isoString}":`, e);
        return t('dates.invalid');
    }
};

/**
 * Formats a date using the user's locale and a default timezone.
 * Respects 12/24 hour preferences automatically.
 * @param dateString The ISO date string.
 * @param options Intl.DateTimeFormatOptions to customize the output.
 * @returns The formatted date string or a localized fallback.
 */
export function formatLocalizedDateTime(dateString?: string, options?: Intl.DateTimeFormatOptions): string {
    if (!dateString) return t('dates.invalid');
    try {
        const date = parseDateStringAsUtc(dateString);
        if (!date) return t('dates.invalid');
        
        const defaultOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit',
            timeZone: 'Asia/Kolkata', // Explicitly set timezone for display
            ...options
        };
        
        // Using en-IN as a base for stable formatting, but Intl will use user's locale preference for 12/24h
        return new Intl.DateTimeFormat('en-IN', defaultOptions).format(date);
    } catch (e) {
        console.error(`Localized date formatting error for "${dateString}":`, e);
        return t('dates.invalid');
    }
}


/**
 * Safely retrieves and parses a JSON item from localStorage.
 * @param key The localStorage key.
 * @param fallback The fallback value if parsing fails or key doesn't exist.
 * @returns The parsed value or the fallback.
 */
export const safeLocalStorageGet = <T,>(key: string, fallback: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console.error(`Error reading from localStorage for key "${key}":`, e);
        return fallback;
    }
};

/**
 * Safely stringifies and sets an item in localStorage.
 * @param key The localStorage key.
 * @param value The value to store.
 */
export const safeLocalStorageSet = <T,>(key: string, value: T) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Error writing to localStorage for key "${key}":`, e);
    }
};

/**
 * Formats a number in Indian style (e.g. 2,55,085).
 */
export const formatIndianNumber = (num: number): string => {
    return new Intl.NumberFormat('en-IN').format(num);
};

/**
 * Converts a number to Indian words (Lakhs/Crores).
 */
export const indianNumberToWords = (num: number): string => {
    if (num === 0) return 'Zero';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const convert = (n: number): string => {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
        return '';
    };

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remaining = Math.floor(num % 1000);
    
    let res = '';
    if (crore > 0) res += convert(crore) + ' Crore ';
    if (lakh > 0) res += convert(lakh) + ' Lakh ';
    if (thousand > 0) res += convert(thousand) + ' Thousand ';
    if (remaining > 0) res += convert(remaining);
    
    return 'Rupees ' + res.trim() + ' Only';
};

/**
 * Checks if a date string falls within a given date range, normalized to local midnight.
 */
export const isDateInRange = (dateString: string | undefined | null, range: { startDate: Date | null, endDate: Date | null } | null): boolean => {
    if (!dateString || !range) return true;
    if (!range.startDate || !range.endDate) return true;
    
    // Extract only the date part YYYY-MM-DD
    const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
    const parts = datePart.split(/[-/]/).map(Number);
    if (parts.length < 3) return true;

    // Create a local Date object at midnight of that day
    const itemDate = new Date(parts[0], parts[1] - 1, parts[2]);
    itemDate.setHours(0, 0, 0, 0);

    // Range dates from picker are already local Date objects
    const start = new Date(range.startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(range.endDate);
    // Ensure end covers the day if it was set to midnight
    if (end.getHours() === 0 && end.getMinutes() === 0) {
        end.setHours(23, 59, 59, 999);
    }
    
    return itemDate >= start && itemDate <= end;
};

/**
 * Conversion rate of currencies to INR (how many Rupees per unit of that currency)
 */
export const CURRENCY_CONVERSION_RATES: Record<string, number> = {
    INR: 1,
    USD: 83.5, // 1 USD = 83.5 INR
    EUR: 90.0, // 1 EUR = 90 INR
    GBP: 106.0, // 1 GBP = 106 INR
    CAD: 61.0, // 1 CAD = 61 INR
    AUD: 55.0, // 1 AUD = 55 INR
    AED: 22.7, // 1 AED = 22.7 INR
    SGD: 61.5, // 1 SGD = 61.5 INR
    JPY: 0.53, // 1 JPY = 0.53 INR
    CNY: 11.5, // 1 CNY = 11.5 INR
};

export const convertToINR = (amount: number, fromCurrency?: string): number => {
    const currency = (fromCurrency || 'INR').toUpperCase();
    const rate = CURRENCY_CONVERSION_RATES[currency] || 1;
    return amount * rate;
};
