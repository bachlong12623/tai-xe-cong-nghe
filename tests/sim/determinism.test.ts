import { describe, it, expect } from 'vitest';
import { createGame, step, dispatch } from '../../src/sim/engine';
import { serializeState } from '../../src/sim/save';

describe('100% Deterministic Simulation Verification', () => {
  it('guarantees identical state hashes across two runs with same seed and action sequence', () => {
    const seed = 987654321;
    let gameA = createGame(seed);
    let gameB = createGame(seed);

    // Initial states must match
    expect(serializeState(gameA)).toBe(serializeState(gameB));

    // Execute 500 steps and several user actions in parallel
    const actions = [
      { stepAt: 10, action: { t: 'GO_ONLINE' as const } },
      { stepAt: 50, action: { t: 'SET_ROUTE_MODE' as const, mode: 'light' as const } },
      { stepAt: 120, action: { t: 'DRINK' as const, itemId: 'ca_phe_den' } },
      { stepAt: 200, action: { t: 'SET_DRIVING_STYLE' as const, style: 'rush' as const } },
      { stepAt: 300, action: { t: 'EAT' as const, itemId: 'com_binh_dan' } },
      { stepAt: 400, action: { t: 'NAP' as const } },
    ];

    for (let stepIdx = 0; stepIdx < 500; stepIdx++) {
      const pendingAction = actions.find((a) => a.stepAt === stepIdx);
      if (pendingAction) {
        gameA = dispatch(gameA, pendingAction.action);
        gameB = dispatch(gameB, pendingAction.action);
      }
      gameA = step(gameA, 1);
      gameB = step(gameB, 1);
    }

    // Both games must be 100% byte-for-byte identical
    const jsonA = serializeState(gameA);
    const jsonB = serializeState(gameB);
    expect(jsonA).toBe(jsonB);
    expect(gameA.rng.state).toBe(gameB.rng.state);
    expect(gameA.economy.cash).toBe(gameB.economy.cash);
    expect(gameA.stats.stamina).toBe(gameB.stats.stamina);
  });

  it('diverges when initialized with different seeds', () => {
    let game1 = createGame(111);
    let game2 = createGame(222);

    game1 = dispatch(game1, { t: 'GO_ONLINE' });
    game2 = dispatch(game2, { t: 'GO_ONLINE' });

    game1 = step(game1, 200);
    game2 = step(game2, 200);

    expect(serializeState(game1)).not.toBe(serializeState(game2));
  });
});
