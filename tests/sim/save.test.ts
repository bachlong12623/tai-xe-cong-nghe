import { describe, it, expect, beforeEach } from 'vitest';
import {
  serializeState,
  deserializeState,
  migrateState,
  saveGame,
  loadGame,
  hasSavedGame,
  deleteSavedGame,
  CURRENT_SCHEMA_VERSION,
} from '../../src/sim/save';
import { createGame } from '../../src/sim/engine';

describe('Save / Load & State Migration (Section 17)', () => {
  // Mock localStorage for test environment
  const storageMock: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(storageMock).forEach((k) => delete storageMock[k]);
    globalThis.localStorage = {
      getItem: (k: string) => storageMock[k] ?? null,
      setItem: (k: string, v: string) => { storageMock[k] = v; },
      removeItem: (k: string) => { delete storageMock[k]; },
      clear: () => { Object.keys(storageMock).forEach((k) => delete storageMock[k]); },
      length: 0,
      key: () => null,
    };
  });

  it('serializes and deserializes game state without data loss', () => {
    const original = createGame(12345);
    original.economy.cash = 1250000;
    original.time.day = 5;
    original.stats.stamina = 73;

    const json = serializeState(original);
    const restored = deserializeState(json);

    expect(restored.economy.cash).toBe(original.economy.cash);
    expect(restored.time.day).toBe(original.time.day);
    expect(restored.stats.stamina).toBe(original.stats.stamina);
    expect(restored.rng.state).toBe(original.rng.state);
  });

  it('migrates legacy states missing schemaVersion to current version', () => {
    const legacy = createGame(999);
    delete (legacy as any).schemaVersion;

    const migrated = migrateState(legacy);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('handles saveGame, loadGame, hasSavedGame and deleteSavedGame cycle', () => {
    expect(hasSavedGame()).toBe(false);

    const game = createGame(42);
    game.economy.cash = 999999;
    expect(saveGame(game)).toBe(true);
    expect(hasSavedGame()).toBe(true);

    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded?.economy.cash).toBe(999999);

    deleteSavedGame();
    expect(hasSavedGame()).toBe(false);
    expect(loadGame()).toBeNull();
  });
});

