import { describe, it, expect } from 'vitest';
import {
  calculateAccidentHourlyProbability,
  checkFloodStallRisk,
  calculateTravelDistance,
} from '../../src/sim/traffic';
import { VehicleCondition } from '../../src/sim/types';
import { createRng } from '../../src/sim/rng';

describe('Accidents & Traffic Hazards - Section 10 Specification', () => {
  const goodVehicle: VehicleCondition = {
    tires: 90,
    oil: 90,
    brakes: 90,
    chain: 90,
    sparkPlug: 90,
  };

  const wornVehicle: VehicleCondition = {
    tires: 20,
    oil: 50,
    brakes: 25,
    chain: 50,
    sparkPlug: 40,
  };

  it('verifies accident probability increases dramatically with drowsiness and worn parts', () => {
    // 1. Normal state: high alertness (90), good tires/brakes, daytime, no rain
    const pNormal = calculateAccidentHourlyProbability(90, goodVehicle, false, false);

    // 2. Severe fatigue: alertness = 10 (< 30 increases chance)
    const pFatigued = calculateAccidentHourlyProbability(10, goodVehicle, false, false);
    expect(pFatigued).toBeGreaterThan(pNormal);

    // 3. Worn tires/brakes (< 50) + rain (x2.0) + night (x1.4)
    const pDangerous = calculateAccidentHourlyProbability(10, wornVehicle, true, true);
    expect(pDangerous).toBeGreaterThan(pFatigued * 2);
  });

  it('verifies route modes and flood stall risk', () => {
    const rng = createRng(42);

    // Dry route bypasses flood stalling completely
    const isStalledDry = checkFloodStallRisk(true, 'dry', 30, rng);
    expect(isStalledDry).toBe(false);

    // Normal fast route through flood with weak spark plug can stall
    const baseDist = 10;
    expect(calculateTravelDistance(baseDist, 'fast')).toBe(10);
    expect(calculateTravelDistance(baseDist, 'light')).toBeCloseTo(11.5, 1);
    expect(calculateTravelDistance(baseDist, 'dry')).toBeCloseTo(12.5, 1);
  });
});

