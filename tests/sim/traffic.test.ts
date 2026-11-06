import { describe, it, expect } from 'vitest';
import {
  getTrafficMultiplier,
  getWeatherSpeedMultiplier,
  calculateTravelTimeMinutes,
  calculateFuelConsumed,
  rollForAccident,
} from '../../src/sim/traffic';
import { GameTime, WeatherState } from '../../src/sim/types';
import { createRng } from '../../src/sim/rng';

describe('Traffic Congestion & Travel Times (Section 8 & 9)', () => {
  const morningRush: GameTime = {
    day: 1,
    dayOfWeek: 1,
    hour: 8,
    minute: 0,
    totalMinutes: 480,
  };

  const clearNight: GameTime = {
    day: 1,
    dayOfWeek: 1,
    hour: 23,
    minute: 30,
    totalMinutes: 1410,
  };

  const fineWeather: WeatherState = {
    type: 'sunny',
    temperature: 30,
    isFlooded: false,
  };

  const stormWeather: WeatherState = {
    type: 'storm',
    temperature: 25,
    isFlooded: true,
  };

  it('slows down travel speed significantly during morning rush hour', () => {
    const rushMult = getTrafficMultiplier(morningRush, 'fast');
    const nightMult = getTrafficMultiplier(clearNight, 'fast');

    expect(rushMult).toBeLessThan(nightMult);
    expect(rushMult).toBe(0.55);
    expect(nightMult).toBe(1.0);
  });

  it('light route suffers less slowdown during peak hours', () => {
    const fastRush = getTrafficMultiplier(morningRush, 'fast');
    const lightRush = getTrafficMultiplier(morningRush, 'light');

    expect(lightRush).toBeGreaterThan(fastRush);
  });

  it('calculates storm weather speed penalties', () => {
    const fineSpeed = getWeatherSpeedMultiplier(fineWeather);
    const stormSpeed = getWeatherSpeedMultiplier(stormWeather);

    expect(stormSpeed).toBeLessThan(fineSpeed);
    expect(stormSpeed).toBe(0.65);
  });

  it('calculates realistic travel duration in minutes', () => {
    // 5 km trip in clear night: ~30km/h => 10 min + buffer
    const minsNight = calculateTravelTimeMinutes(5, 30, clearNight, fineWeather, 100, 'fast');
    // 5 km trip in storm morning rush: ~10km/h => ~30+ min
    const minsStormRush = calculateTravelTimeMinutes(5, 30, morningRush, stormWeather, 100, 'fast');

    expect(minsNight).toBeLessThan(minsStormRush);
    expect(minsStormRush).toBeGreaterThan(25);
  });

  it('calculates fuel consumption accurately', () => {
    // Wave Alpha consumes 1.9L / 100km
    const fuelFor10Km = calculateFuelConsumed(10, 1.9);
    expect(fuelFor10Km).toBeCloseTo(0.19, 3);
  });

  it('severe accident rolls hospital daysOff between 3 and 14 days', () => {
    const rng = createRng(999);
    const wornCond = { tires: 10, oil: 10, brakes: 10, chain: 10, sparkPlug: 10 };
    // Force severe accident roll with high risk
    for (let i = 0; i < 50; i++) {
      const accident = rollForAccident(5, wornCond, stormWeather, clearNight, rng, 100);
      if (accident && accident.severity === 'severe') {
        expect(accident.daysOff).toBeGreaterThanOrEqual(3);
        expect(accident.daysOff).toBeLessThanOrEqual(14);
        expect(accident.medicalCost).toBeGreaterThanOrEqual(5000000);
        break;
      }
    }
  });
});
