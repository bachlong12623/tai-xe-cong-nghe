import { describe, it, expect } from 'vitest';
import {
  createInitialWeather,
  getBaseTemperature,
  updateWeather,
} from '../../src/sim/weather';
import { createRng } from '../../src/sim/rng';

describe('Weather System (Section 8)', () => {
  it('creates initial sunny weather at 29°C', () => {
    const w = createInitialWeather();
    expect(w.type).toBe('sunny');
    expect(w.temperature).toBe(29);
    expect(w.isFlooded).toBe(false);
  });

  it('calculates diurnal temperature cycle matching TP.HCM climate', () => {
    expect(getBaseTemperature(3)).toBe(26); // Night cool
    expect(getBaseTemperature(8)).toBe(28); // Early morning
    expect(getBaseTemperature(13)).toBe(35); // Noon peak heat
    expect(getBaseTemperature(19)).toBe(29); // Evening
  });

  it('steps weather state via Markov transitions and triggers flooding in heavy rain', () => {
    const rng = createRng(100);
    let weather = createInitialWeather();

    // Run 24 hours of transitions
    const typesSeen = new Set<string>();
    for (let h = 0; h < 24; h++) {
      weather = updateWeather(weather, h, rng);
      typesSeen.add(weather.type);
      if (weather.type === 'heavy_rain' || weather.type === 'storm') {
        expect(weather.isFlooded).toBe(true);
      }
    }

    expect(typesSeen.size).toBeGreaterThan(1);
  });
});
