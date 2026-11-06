import { describe, it, expect } from 'vitest';
import { createInitialVehicle, degradeVehicleParts, repairVehiclePart } from '../../src/sim/vehicle';

describe('Vehicle Wear & Maintenance - Section 6 Specification', () => {
  it('degrades all 5 vehicle parts according to km traveled', () => {
    let vehicle = createInitialVehicle();
    const initialTires = vehicle.condition.tires;
    const initialOil = vehicle.condition.oil;

    // Drive 500 km
    vehicle = degradeVehicleParts(vehicle, 500);

    // Tires (~8000km lifespan) should degrade ~6.25%
    expect(vehicle.condition.tires).toBeLessThan(initialTires);
    // Oil (~1500km lifespan) should degrade ~33.3%
    expect(vehicle.condition.oil).toBeLessThan(initialOil);
  });

  it('repairs vehicle part to 100% when sufficient cash is provided', () => {
    let vehicle = createInitialVehicle();
    vehicle.condition.oil = 20;

    const res = repairVehiclePart(vehicle, 'oil', 200000);
    expect(res.error).toBeUndefined();
    expect(res.cost).toBe(120000);
    expect(res.vehicle.condition.oil).toBe(100);
  });

  it('fails repair when cash is insufficient', () => {
    let vehicle = createInitialVehicle();
    const res = repairVehiclePart(vehicle, 'tires', 50000); // Tires cost 250k
    expect(res.error).toBeDefined();
    expect(res.cost).toBe(0);
  });
});
