import { GameState } from './types';

const SAVE_KEY = 'tai_xe_cong_nghe_save';
export const CURRENT_SCHEMA_VERSION = 1;

export function serializeState(state: GameState): string {
  return JSON.stringify(state);
}

export function deserializeState(jsonStr: string): GameState {
  const parsed = JSON.parse(jsonStr) as GameState;
  return migrateState(parsed);
}

export function migrateState(state: GameState): GameState {
  if (!state.schemaVersion || state.schemaVersion < CURRENT_SCHEMA_VERSION) {
    // Migration logic for future versions
    state.schemaVersion = CURRENT_SCHEMA_VERSION;
  }
  return state;
}

export function saveGame(state: GameState): boolean {
  try {
    const serialized = serializeState(state);
    localStorage.setItem(SAVE_KEY, serialized);
    return true;
  } catch (err) {
    console.error('Failed to save game to localStorage', err);
    return false;
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return deserializeState(raw);
  } catch (err) {
    console.error('Failed to load game from localStorage', err);
    return null;
  }
}

export function hasSavedGame(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

export function deleteSavedGame(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (err) {
    console.error('Failed to clear save', err);
  }
}

