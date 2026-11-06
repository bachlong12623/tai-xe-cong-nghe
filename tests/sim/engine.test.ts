import { describe, it, expect } from 'vitest';
import { createGame, step, dispatch, getView } from '../../src/sim/engine';
import { serializeState, deserializeState } from '../../src/sim/save';

describe('Engine - Milestone 1 Acceptance Test', () => {
  it('creates initial game state cleanly and deterministically', () => {
    const game1 = createGame(12345);
    const game2 = createGame(12345);

    expect(game1.time.day).toBe(1);
    expect(game1.time.hour).toBe(5);
    expect(game1.stats.stamina).toBe(100);
    expect(game1.stats.hunger).toBe(80);
    expect(game1.stats.alertness).toBe(95);
    expect(game1.stats.morale).toBe(90);

    expect(game1.rng.state).toBe(game2.rng.state);
  });

  it('runs complete 24 hours of gameplay without errors', () => {
    let game = createGame(42);
    expect(game.time.day).toBe(1);

    // Step 24h = 1440 minutes
    game = step(game, 1440);

    expect(game.time.day).toBe(2);
    expect(game.time.hour).toBe(5);
    expect(game.time.minute).toBe(0);

    // Stats should have evolved within [0, 100]
    expect(game.stats.stamina).toBeGreaterThanOrEqual(0);
    expect(game.stats.stamina).toBeLessThanOrEqual(100);
    expect(game.stats.hunger).toBeGreaterThanOrEqual(0);
    expect(game.stats.hunger).toBeLessThanOrEqual(100);
    expect(game.stats.alertness).toBeGreaterThanOrEqual(0);
    expect(game.stats.alertness).toBeLessThanOrEqual(100);

    const view = getView(game);
    expect(view.day).toBe(2);
    expect(view.hour).toBe(5);
  });

  it('handles user actions: speed changes, eating, drinking, refueling', () => {
    let game = createGame(99);

    // Speed change
    game = dispatch(game, { t: 'SET_SPEED', speed: 4 });
    expect(game.speed).toBe(4);

    // Go online & offline
    game = dispatch(game, { t: 'GO_ONLINE' });
    expect(game.app.isOnline).toBe(true);
    game = dispatch(game, { t: 'GO_OFFLINE' });
    expect(game.app.isOnline).toBe(false);

    // Eat food (banh_mi takes 15 minutes, during which hunger restores +25 then decays 1.0)
    const initialCash = game.economy.cash;
    game = dispatch(game, { t: 'EAT', itemId: 'banh_mi' });
    expect(game.economy.cash).toBe(initialCash - 20000);
    expect(game.stats.hunger).toBeCloseTo(99, 1);

    // Drink coffee
    const initialAlertness = game.stats.alertness;
    game = dispatch(game, { t: 'DRINK', itemId: 'ca_phe_den' });
    expect(game.stats.alertness).toBeGreaterThan(initialAlertness);

    // Refuel
    game = dispatch(game, { t: 'REFUEL' });
    expect(game.vehicle.fuelCurrent).toBeCloseTo(game.vehicle.fuelCapacity, 0.1);
  });

  it('serializes and deserializes state without loss of data', () => {
    let game = createGame(777);
    game = step(game, 120);
    game = dispatch(game, { t: 'EAT', itemId: 'mi_goi' });

    const json = serializeState(game);
    const restored = deserializeState(json);

    expect(restored.time.totalMinutes).toBe(game.time.totalMinutes);
    expect(restored.economy.cash).toBe(game.economy.cash);
    expect(restored.stats.hunger).toBe(game.stats.hunger);
    expect(restored.vehicle.fuelCurrent).toBe(game.vehicle.fuelCurrent);
  });
});
