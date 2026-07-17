let translations: { [key: string]: any } = {};

/**
 * Asynchronously fetches and loads the translation file.
 * This must be called before the application renders.
 */
export async function initI18n() {
    try {
        // Fetch the JSON file directly. Note: fetch does not use the import map.
        const response = await fetch('/locales/en.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch translations: ${response.statusText}`);
        }
        const data = await response.json();
        translations = data;
    } catch (error) {
        console.error('Could not load translations:', error);
        // Fallback to an empty object to prevent the app from crashing.
        translations = {};
    }
}

type TranslationObject = { [key: string]: string | TranslationObject };

/**
 * Gets a translation string for a given key.
 * @param key The key for the translation string (e.g., 'common.save').
 * @param params Optional parameters to replace in the string (e.g., { count: 5 }).
 * @returns The translated string or the key itself if not found.
 */
export function t(key: string, params?: { [key: string]: string | number }): string {
    const keys = key.split('.');
    let result: string | TranslationObject | undefined = translations;

    for (const k of keys) {
        if (typeof result === 'object' && result !== null) {
            result = (result as TranslationObject)[k];
        } else {
            result = undefined;
            break;
        }
    }

    if (typeof result === 'string') {
        if (params) {
            return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
                return acc.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
            }, result);
        }
        return result;
    }

    console.warn(`[i18n] Translation for key "${key}" not found.`);
    return key; // Fallback to the key itself
}
