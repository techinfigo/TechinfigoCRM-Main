
import { useState, useRef, useEffect, useCallback } from 'react';
import { debounce } from '@/utils';
import { load, save } from '@/storage';
import { ToastData } from '../types';
import { diff, patch } from '@/utils/diff';

// --- TYPE DEFINITIONS ---

type PatchType = 'create' | 'update' | 'delete' | 'batch';

interface ActionPayload<T> {
  type: PatchType;
  description: string;
  payload: any;
}

interface HistoryEntry<T> {
  description: string;
  timestamp: number;
  forwardPatch: Patch<T>;
  reversePatch: Patch<T>;
}

type Patch<T> =
  | { type: 'create'; item: T }
  | { type: 'delete'; item: T }
  | { type: 'update'; id: string; forward: any; reverse: any }
  | { type: 'batch'; oldState: T[]; newState: T[] };

const MAX_HISTORY_SIZE = 30;

// --- HOOK IMPLEMENTATION ---

export const useUndoRedo = <T extends { id: string }>(
  storageKey: string,
  initialValue: T[] | any, // Type relaxed to handle potential raw storage objects
  showToast: (options: ToastData) => void
) => {
  const [isInitialized, setIsInitialized] = useState(false);

  // Robustly initialize state.
  // initialValue might be T[] (legacy) or { state: T[], history: ... } (new format) depending on how load() behaves in App.tsx
  const [state, setState] = useState<T[]>(() => {
    if (Array.isArray(initialValue)) {
      return initialValue;
    }
    if (initialValue && typeof initialValue === 'object' && 'state' in initialValue && Array.isArray(initialValue.state)) {
      return initialValue.state;
    }
    return [];
  });

  const [history, setHistory] = useState<HistoryEntry<T>[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry<T>[]>([]);

  // --- PERSISTENCE ---

  useEffect(() => {
    // Load from storage on initial mount to sync history and redo stack
    const stored = load<any>(storageKey, null);
    
    if (stored) {
      if (Array.isArray(stored)) {
        // Handle legacy format: just an array
        setState(stored);
        setHistory([]);
        setRedoStack([]);
      } else if (stored.state && Array.isArray(stored.state)) {
        // Handle new format
        setState(stored.state);
        setHistory(stored.history || []);
        setRedoStack(stored.redo || []);
      }
    }
    setIsInitialized(true);
  }, [storageKey]);

  const debouncedSave = useRef(
    debounce((dataToSave: { state: T[]; history: HistoryEntry<T>[]; redo: HistoryEntry<T>[] }) => {
      save(storageKey, dataToSave);
    }, 150)
  ).current;

  useEffect(() => {
    if (isInitialized) {
      debouncedSave({ state, history, redo: redoStack });
    }
  }, [state, history, redoStack, debouncedSave, isInitialized]);

  // --- CORE ACTIONS ---

  const setWithHistory = useCallback((newItems: T[], action: ActionPayload<T>) => {
    const oldItems = state;
    let forwardPatch: Patch<T>;
    let reversePatch: Patch<T>;

    switch (action.type) {
      case 'create':
        forwardPatch = { type: 'create', item: action.payload };
        reversePatch = { type: 'delete', item: action.payload };
        break;
      case 'delete':
        forwardPatch = { type: 'delete', item: action.payload };
        reversePatch = { type: 'create', item: action.payload };
        break;
      case 'update':
        const { old: oldItem, new: newItem } = action.payload;
        forwardPatch = { type: 'update', id: oldItem.id, forward: diff(oldItem, newItem), reverse: diff(newItem, oldItem) };
        reversePatch = { type: 'update', id: newItem.id, forward: diff(newItem, oldItem), reverse: diff(oldItem, newItem) };
        break;
      case 'batch':
      default:
        forwardPatch = { type: 'batch', oldState: oldItems, newState: newItems };
        reversePatch = { type: 'batch', oldState: newItems, newState: oldItems };
        break;
    }

    const newHistoryEntry: HistoryEntry<T> = {
      description: action.description,
      timestamp: Date.now(),
      forwardPatch,
      reversePatch,
    };

    setHistory(prev => [...prev.slice(Math.max(0, prev.length - MAX_HISTORY_SIZE + 1)), newHistoryEntry]);
    setRedoStack([]); // Clear redo stack on new action
    setState(newItems);
  }, [state]);

  const applyPatch = (currentState: T[], patchData: Patch<T>): T[] => {
    switch (patchData.type) {
      case 'create':
        return [patchData.item, ...currentState];
      case 'delete':
        return currentState.filter(i => i.id !== patchData.item.id);
      case 'update':
        return currentState.map(i => i.id === patchData.id ? patch(i, patchData.reverse) : i);
      case 'batch':
        return patchData.newState;
      default:
        return currentState;
    }
  };

  const undo = useCallback(() => {
    if (history.length === 0) return;

    const lastAction = history[history.length - 1];
    // For undo, we apply the *reverse* patch
    const previousState = applyPatch(state, lastAction.reversePatch);

    setHistory(prev => prev.slice(0, -1));
    setRedoStack(prev => [lastAction, ...prev]);
    setState(previousState);
    showToast({ title: 'Undone', description: lastAction.description });
  }, [history, state, showToast]);
  
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const nextAction = redoStack[0];
    // For redo, we apply the *forward* patch (or reconstruct based on logic, here we simplistically apply forward)
    // Note: For 'update' with diffs, 'applyPatch' uses 'reverse' in switch above for UNDO.
    // For REDO, we need logic that applies 'forward'.
    
    let nextState: T[] = state;
    
    switch (nextAction.forwardPatch.type) {
        case 'create':
             nextState = [nextAction.forwardPatch.item, ...state];
             break;
        case 'delete':
             nextState = state.filter(i => i.id !== (nextAction.forwardPatch as any).item.id);
             break;
        case 'update':
             nextState = state.map(i => i.id === (nextAction.forwardPatch as any).id ? patch(i, (nextAction.forwardPatch as any).forward) : i);
             break;
        case 'batch':
             nextState = (nextAction.forwardPatch as any).newState;
             break;
    }

    setRedoStack(prev => prev.slice(1));
    setHistory(prev => [...prev, nextAction]);
    setState(nextState);
    showToast({ title: 'Redone', description: nextAction.description });
  }, [redoStack, state, showToast]);

  return {
    state,
    set: setWithHistory,
    undo,
    redo,
    canUndo: history.length > 0,
    canRedo: redoStack.length > 0,
  };
};
