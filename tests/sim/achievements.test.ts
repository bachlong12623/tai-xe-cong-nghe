import { describe, it, expect } from 'vitest';
import { evaluateAchievements, getAllAchievements } from '../../src/sim/achievements';
import { createGame } from '../../src/sim/engine';

describe('Achievements System (Milestone 6)', () => {
  it('loads all 12 achievements from JSON', () => {
    const list = getAllAchievements();
    expect(list.length).toBe(12);
    const ids = list.map((a) => a.id);
    expect(ids).toContain('first_trip');
    expect(ids).toContain('night_owl');
    expect(ids).toContain('rain_rider');
    expect(ids).toContain('green_revolution');
    expect(ids).toContain('survive_7_days');
  });

  it('unlocks first_trip when totalTripsCompleted >= 1', () => {
    const game = createGame(100);
    game.app.totalTripsCompleted = 1;

    const { unlockedNewIds, logsToAdd } = evaluateAchievements(game);
    expect(unlockedNewIds).toContain('first_trip');
    expect(logsToAdd.length).toBeGreaterThan(0);
    expect(logsToAdd[0].text).toContain('Chuyến xe đầu tiên');
  });

  it('unlocks night_owl when driving during late night (0h - 4h)', () => {
    const game = createGame(100);
    game.app.totalTripsCompleted = 2;
    game.time.hour = 2;

    const { unlockedNewIds } = evaluateAchievements(game);
    expect(unlockedNewIds).toContain('night_owl');
  });

  it('unlocks rain_rider when driving in storm or heavy rain', () => {
    const game = createGame(100);
    game.app.totalTripsCompleted = 3;
    game.weather = {
      type: 'heavy_rain',
      temperature: 26,
      isFlooded: true,
    };

    const { unlockedNewIds } = evaluateAchievements(game);
    expect(unlockedNewIds).toContain('rain_rider');
  });

  it('unlocks green_revolution when switching to electric vehicle', () => {
    const game = createGame(100);
    game.vehicle.fuelType = 'electric';

    const { unlockedNewIds } = evaluateAchievements(game);
    expect(unlockedNewIds).toContain('green_revolution');
  });

  it('unlocks survive_7_days when reaching day 7', () => {
    const game = createGame(100);
    game.time.day = 7;

    const { unlockedNewIds } = evaluateAchievements(game);
    expect(unlockedNewIds).toContain('survive_7_days');
  });
});
