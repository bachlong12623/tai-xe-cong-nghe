import { describe, it, expect } from 'vitest';
import {
  createInitialStats,
  updateStatsPerMinute,
  applyEatFood,
  applyDrinkCoffee,
  applyPowerNap,
  processDailySleepDebt,
} from '../../src/sim/stats';
import { WeatherState, GameTime } from '../../src/sim/types';

describe('Stats System - Section 5 formulas', () => {
  const dummyWeather: WeatherState = { type: 'sunny', temperature: 30, isFlooded: false };
  const hotWeather: WeatherState = { type: 'sunny', temperature: 36, isFlooded: false };

  const dayTime: GameTime = {
    day: 1,
    dayOfWeek: 1,
    hour: 10,
    minute: 0,
    totalMinutes: 600,
  };

  const nightTime: GameTime = {
    day: 1,
    dayOfWeek: 1,
    hour: 1,
    minute: 0,
    totalMinutes: 60,
  };

  it('verifies applyEatFood increases Hunger and Morale correctly', () => {
    let stats = createInitialStats();
    stats.hunger = 40;
    stats.morale = 60;

    stats = applyEatFood(stats, 45, 2);
    expect(stats.hunger).toBe(85);
    expect(stats.morale).toBe(62);
  });

  it('verifies Hunger decays at -4 per hour', () => {
    let stats = createInitialStats();
    const initialHunger = stats.hunger;

    // Simulate 60 minutes
    for (let m = 0; m < 60; m++) {
      const res = updateStatsPerMinute(stats, dayTime, {
        isDriving: false,
        isWaitingForOrder: false,
        isResting: true,
        isSleeping: false,
        weather: dummyWeather,
      });
      stats = res.stats;
    }

    expect(stats.hunger).toBeCloseTo(initialHunger - 4.0, 1);
  });

  it('verifies Stamina decay rates: resting (-0.5/h), waiting (-1.5/h), driving (-5/h), hot (+2/h)', () => {
    // 1. Resting: -0.5/h
    let statsResting = createInitialStats();
    for (let m = 0; m < 60; m++) {
      statsResting = updateStatsPerMinute(statsResting, dayTime, {
        isDriving: false,
        isWaitingForOrder: false,
        isResting: true,
        isSleeping: false,
        weather: dummyWeather,
      }).stats;
    }
    expect(statsResting.stamina).toBeCloseTo(100 - 0.5, 1);

    // 2. Waiting for orders: -1.5/h
    let statsWaiting = createInitialStats();
    for (let m = 0; m < 60; m++) {
      statsWaiting = updateStatsPerMinute(statsWaiting, dayTime, {
        isDriving: false,
        isWaitingForOrder: true,
        isResting: false,
        isSleeping: false,
        weather: dummyWeather,
      }).stats;
    }
    expect(statsWaiting.stamina).toBeCloseTo(100 - 1.5, 1);

    // 3. Driving: -5.0/h
    let statsDriving = createInitialStats();
    for (let m = 0; m < 60; m++) {
      statsDriving = updateStatsPerMinute(statsDriving, dayTime, {
        isDriving: true,
        isWaitingForOrder: false,
        isResting: false,
        isSleeping: false,
        weather: dummyWeather,
      }).stats;
    }
    expect(statsDriving.stamina).toBeCloseTo(100 - 5.0, 1);

    // 4. Driving in hot weather (>34C): -5.0 - 2.0 = -7.0/h
    let statsHot = createInitialStats();
    for (let m = 0; m < 60; m++) {
      statsHot = updateStatsPerMinute(statsHot, dayTime, {
        isDriving: true,
        isWaitingForOrder: false,
        isResting: false,
        isSleeping: false,
        weather: hotWeather,
      }).stats;
    }
    expect(statsHot.stamina).toBeCloseTo(100 - 7.0, 1);
  });

  it('verifies Alertness decay day (-3/h) vs night (-6/h)', () => {
    // Day decay: -3/h
    let statsDay = createInitialStats();
    for (let m = 0; m < 60; m++) {
      statsDay = updateStatsPerMinute(statsDay, dayTime, {
        isDriving: false,
        isWaitingForOrder: false,
        isResting: true,
        isSleeping: false,
        weather: dummyWeather,
      }).stats;
    }
    expect(statsDay.alertness).toBeCloseTo(95 - 3.0, 1);

    // Night decay: -6/h
    let statsNight = createInitialStats();
    for (let m = 0; m < 60; m++) {
      statsNight = updateStatsPerMinute(statsNight, nightTime, {
        isDriving: false,
        isWaitingForOrder: false,
        isResting: true,
        isSleeping: false,
        weather: dummyWeather,
      }).stats;
    }
    expect(statsNight.alertness).toBeCloseTo(95 - 6.0, 1);
  });

  it('verifies Sleep recovery: Stamina +12/h, Alertness +14/h', () => {
    let stats = createInitialStats();
    stats.stamina = 50;
    stats.alertness = 40;

    for (let m = 0; m < 60; m++) {
      stats = updateStatsPerMinute(stats, nightTime, {
        isDriving: false,
        isWaitingForOrder: false,
        isResting: false,
        isSleeping: true,
        weather: dummyWeather,
      }).stats;
    }

    expect(stats.stamina).toBeCloseTo(50 + 12.0, 1);
    expect(stats.alertness).toBeCloseTo(40 + 14.0, 1);
  });

  it('verifies Coffee boosts Alertness +20 and crashes after 3 hours', () => {
    let stats = createInitialStats();
    stats.alertness = 50;

    const startMinute = 600;
    const coffeeRes = applyDrinkCoffee(stats, startMinute, 20);
    stats = coffeeRes.stats;
    expect(stats.alertness).toBeCloseTo(70, 1);
    expect(stats.coffeeCrashes.length).toBe(1);
    expect(stats.coffeeCrashes[0].triggerAtMinute).toBe(startMinute + 180);

    // Advance 179 minutes
    for (let m = 1; m < 180; m++) {
      const curTime: GameTime = { ...dayTime, totalMinutes: startMinute + m };
      stats = updateStatsPerMinute(stats, curTime, {
        isDriving: false,
        isWaitingForOrder: false,
        isResting: true,
        isSleeping: false,
        weather: dummyWeather,
      }).stats;
    }
    expect(stats.coffeeCrashes.length).toBe(1);

    // 180th minute: crash occurs (-15 penalty)
    const crashTime: GameTime = { ...dayTime, totalMinutes: startMinute + 180 };
    const stepRes = updateStatsPerMinute(stats, crashTime, {
      isDriving: false,
      isWaitingForOrder: false,
      isResting: true,
      isSleeping: false,
      weather: dummyWeather,
    });
    expect(stepRes.events.length).toBeGreaterThan(0);
    expect(stepRes.stats.coffeeCrashes.length).toBe(0);
  });

  it('verifies Power nap gives +15 alertness, +5 stamina with 4h cooldown', () => {
    let stats = createInitialStats();
    stats.alertness = 40;
    stats.stamina = 40;

    const nap1 = applyPowerNap(stats, 100);
    expect(nap1.success).toBe(true);
    expect(nap1.stats.alertness).toBe(55);
    expect(nap1.stats.stamina).toBe(45);

    // Attempting nap within 240 minutes fails
    const nap2 = applyPowerNap(nap1.stats, 200);
    expect(nap2.success).toBe(false);

    // Attempting nap after 240 minutes succeeds
    const nap3 = applyPowerNap(nap1.stats, 350);
    expect(nap3.success).toBe(true);
  });

  it('verifies Sleep debt calculation for <7h sleep and >7h sleep', () => {
    let stats = createInitialStats();
    stats.dailyHoursSlept = 5; // Deficit: 2h

    const res1 = processDailySleepDebt(stats);
    expect(res1.stats.sleepDebt).toBe(2);

    // Next day sleeps 9 hours (excess: 2h -> reduces debt by 2 * 0.5 = 1h)
    stats = res1.stats;
    stats.dailyHoursSlept = 9;
    const res2 = processDailySleepDebt(stats);
    expect(res2.stats.sleepDebt).toBe(1);
  });
});
