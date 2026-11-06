import { describe, it, expect } from 'vitest';
import eventsData from '../../data/events.json';
import { isEventEligible, applyEventOption } from '../../src/sim/events';
import { createGame } from '../../src/sim/engine';
import { GameEvent } from '../../src/sim/types';

describe('Events System - Milestone 4 Specification', () => {
  it('contains at least 15 rich street events with trade-off choices', () => {
    expect(eventsData.length).toBeGreaterThanOrEqual(15);
    for (const evt of eventsData) {
      expect(evt.id).toBeDefined();
      expect(evt.name).toBeDefined();
      expect(evt.options.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('evaluates event eligibility based on weather and night conditions', () => {
    const gameDay = createGame(1);
    gameDay.weather.isFlooded = false;
    gameDay.time.hour = 12;

    const floodEvent: GameEvent = {
      id: 'test_flood',
      name: 'Ngập lụt',
      description: 'Đường ngập',
      options: [],
      conditions: { requiresFlood: true },
    };

    expect(isEventEligible(floodEvent, gameDay)).toBe(false);

    // When flooded
    gameDay.weather.isFlooded = true;
    expect(isEventEligible(floodEvent, gameDay)).toBe(true);
  });

  it('applies chosen option effects, costs, and sets cooldown properly', () => {
    let game = createGame(2);
    const initialCash = game.economy.cash;
    const initialMorale = game.stats.morale;

    const sampleEvent = (eventsData as GameEvent[]).find((e) => e.id === 'thung_lop')!;
    const res = applyEventOption(game, sampleEvent, 0); // Option 0: Vá xe 50k

    expect(res.state.economy.cash).toBe(initialCash - 50000);
    expect(res.state.stats.morale).toBe(initialMorale - 3);
    expect(res.state.recentEventCooldowns['thung_lop']).toBeGreaterThan(game.time.totalMinutes);
    expect(res.state.activeEvent).toBeNull();
  });
});
