// A simple deep equality check function.
export function deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;

    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
        return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
}

/**
 * Calculates a "diff" object between two objects.
 * The returned object contains keys that were changed, showing the new value from 'a'.
 * @param a The "new" object.
 * @param b The "old" object.
 * @returns A patch object to transform 'b' into 'a'.
 */
export function diff(b: any, a: any): any {
    if (deepEqual(a, b)) return {};
    
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
        return a;
    }
    
    const result: any = {};
    const aKeys = new Set(Object.keys(a));

    // Iterate over keys in the old object 'b'
    for (const key in b) {
        if (aKeys.has(key)) {
            // Key exists in both. If they are different, recurse.
            if (!deepEqual(a[key], b[key])) {
                result[key] = diff(b[key], a[key]);
            }
            aKeys.delete(key);
        } else {
            // Key was deleted in 'a'. To apply this, we set it to undefined.
            result[key] = undefined;
        }
    }
    
    // Any remaining keys in aKeys are new. Add them.
    for (const key of aKeys) {
        result[key] = a[key];
    }
    
    return result;
}

/**
 * Applies a patch to an object, returning a new patched object.
 * @param source The object to patch.
 * @param patchObj The patch object.
 * @returns A new object with the patch applied.
 */
export function patch<T>(source: T, patchObj: any): T {
    if (typeof patchObj !== 'object' || patchObj === null || Array.isArray(patchObj)) {
        return patchObj;
    }
    
    const result: any = Array.isArray(source) ? [...source] : { ...source };
    
    for (const key in patchObj) {
        if (patchObj[key] === undefined) {
            delete result[key];
        } else if (
            typeof patchObj[key] === 'object' && patchObj[key] !== null &&
            !Array.isArray(patchObj[key]) &&
            source && typeof (source as any)[key] === 'object' && (source as any)[key] !== null
        ) {
            result[key] = patch((source as any)[key], patchObj[key]);
        } else {
            result[key] = patchObj[key];
        }
    }

    return result as T;
}