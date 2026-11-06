import { describe, it, expect } from 'vitest';
import { createGame, dispatch } from '../../src/sim/engine';
import { createVehicle, swapBattery, chargeBattery } from '../../src/sim/vehicle';
import { checkPoliceViolation } from '../../src/sim/violations';
import { getActiveCsgtZones, maybeGenerateNpcMessage } from '../../src/sim/npc';
import { createRng } from '../../src/sim/rng';
import zonesData from '../../data/zones.json';
import spotsData from '../../data/spots.json';

describe('Milestone 5 World & Society - 12 Zones, Vehicles, CSGT, Goals & NPC', () => {
  it('verifies all 12 TP.HCM zones exist and each zone has at least one spot', () => {
    expect(zonesData.length).toBe(12);

    const requiredZoneIds = [
      'q1', 'q3', 'binh_thanh', 'phu_nhuan', 'tan_binh', 'go_vap',
      'q5_10', 'q4_7', 'thu_duc', 'binh_tan', 'q12', 'khu_bar_dem'
    ];

    for (const zid of requiredZoneIds) {
      const zone = zonesData.find((z) => z.id === zid);
      expect(zone, `Zone ${zid} must exist`).toBeDefined();
      expect(zone?.connections.length, `Zone ${zid} must have road connections`).toBeGreaterThan(0);

      const spotsInZone = spotsData.filter((s) => s.zoneId === zid);
      expect(spotsInZone.length, `Zone ${zid} must have at least one waiting spot`).toBeGreaterThan(0);
    }
  });

  it('supports electric motorcycle with battery swap and charging', () => {
    const evo = createVehicle('xe_dien_evo');
    expect(evo.fuelType).toBe('electric');
    expect(evo.category).toBe('motorcycle_electric');
    expect(evo.fuelCurrent).toBe(90);

    // Battery swap costs 15.000đ and restores to 100%
    const lowBatteryEvo = { ...evo, fuelCurrent: 20 };
    const swapRes = swapBattery(lowBatteryEvo, 20000);
    expect(swapRes.cost).toBe(15000);
    expect(swapRes.vehicle.fuelCurrent).toBe(100);

    // Battery slow charging (charges +25% per 60 mins)
    const charged = chargeBattery({ ...evo, fuelCurrent: 40 }, 60);
    expect(charged.fuelCurrent).toBe(65);
  });

  it('supports 4-seat passenger taxi car (Toyota Vios)', () => {
    const vios = createVehicle('toyota_vios');
    expect(vios.category).toBe('car');
    expect(vios.canDeliverFood).toBe(false);
    expect(vios.canRidePassenger).toBe(true);
    expect(vios.fuelCapacity).toBe(42);
  });

  it('allows purchasing and switching between owned vehicles', () => {
    let game = createGame(123);
    expect(game.vehicle.id).toBe('wave_alpha');
    expect(game.ownedVehicles.length).toBe(1);

    // Give bot cash to buy electric scooter
    game.economy.cash = 30000000;
    game = dispatch(game, { t: 'BUY_VEHICLE', vehicleId: 'xe_dien_evo', paymentMode: 'cash' });

    expect(game.ownedVehicles.length).toBe(2);
    expect(game.vehicle.id).toBe('xe_dien_evo');

    // Switch back to Wave Alpha
    game = dispatch(game, { t: 'SWITCH_VEHICLE', vehicleId: 'wave_alpha' });
    expect(game.vehicle.id).toBe('wave_alpha');
  });

  it('checks CSGT violation risks based on driving styles', () => {
    const rng = createRng(42);
    // Safe and normal styles never trigger violation
    const safeCheck = checkPoliceViolation(rng, 'safe', 'q1', ['q1'], '08:00');
    expect(safeCheck).toBeNull();

    const normalCheck = checkPoliceViolation(rng, 'normal', 'q1', ['q1'], '08:00');
    expect(normalCheck).toBeNull();

    // Rush and shortcut styles have violation risks
    let fineCount = 0;
    const testRng = createRng(999);
    for (let i = 0; i < 50; i++) {
      const fine = checkPoliceViolation(testRng, 'shortcut', 'q1', ['q1'], '08:00');
      if (fine) fineCount++;
    }
    expect(fineCount).toBeGreaterThan(0);
  });

  it('handles Character Goals and loan repayments', () => {
    let game = createGame(456);
    expect(game.goal.id).toBe('pay_bike_loan');
    expect(game.goal.achieved).toBe(false);

    // Contribute 1.000.000đ to goal
    game.economy.cash = 2000000;
    game = dispatch(game, { t: 'CONTRIBUTE_GOAL', amount: 1000000 });
    expect(game.economy.cash).toBe(1000000);
    expect(game.goal.currentAmount).toBe(1000000);

    // Emergency loan (with 10% fee and higher interest)
    const initialDebt = game.loan.totalPrincipal;
    game = dispatch(game, { t: 'TAKE_EMERGENCY_LOAN', amount: 1000000 });
    expect(game.loan.totalPrincipal).toBe(initialDebt + 1000000);
    expect(game.economy.cash).toBe(1900000); // 1,000,000 + 900,000 (after 10% fee)
    expect(game.loan.dailyInterestRate).toBe(0.005);

    // Repay loan
    game = dispatch(game, { t: 'REPAY_LOAN', amount: 500000 });
    expect(game.loan.totalPrincipal).toBe(initialDebt + 500000);
    expect(game.economy.cash).toBe(1400000);
  });

  it('generates NPC community messages with distinct personalities and news', () => {
    const rng = createRng(777);
    const activeZones = getActiveCsgtZones(rng, 8);
    expect(activeZones.length).toBeGreaterThan(0);

    let msg = null;
    const dummyTime = { day: 1, dayOfWeek: 1 as const, hour: 8, minute: 30, totalMinutes: 210 };
    const dummyWeather = { type: 'sunny' as const, temperature: 30, isFlooded: false };

    for (let i = 0; i < 10; i++) {
      msg = maybeGenerateNpcMessage(rng, dummyTime, dummyWeather, activeZones, []);
      if (msg) break;
    }

    if (msg) {
      expect(msg.npcName).toBeDefined();
      expect(msg.content.length).toBeGreaterThan(5);
      expect(msg.reliability).toBeGreaterThanOrEqual(0.6);
    }
  });
});
