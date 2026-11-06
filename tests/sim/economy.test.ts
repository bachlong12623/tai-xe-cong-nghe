import { describe, it, expect } from 'vitest';
import { createInitialEconomy, generateDailySummary } from '../../src/sim/economy';
import { createInitialStats } from '../../src/sim/stats';

describe('Economy & Living Costs (Section 6 & 19)', () => {
  it('creates initial economy with configured cash and wallet', () => {
    const eco = createInitialEconomy();
    expect(eco.cash).toBe(300000);
    expect(eco.appWallet).toBe(150000);
    expect(eco.todayExpenses.rent).toBe(0);
    expect(eco.todayExpenses.fuel).toBe(0);
  });

  it('calculates daily summary deducting platform fee, fuel, food, rent and vehicle wear', () => {
    const eco = createInitialEconomy();
    eco.todayRevenue = 1000000;
    eco.todayTips = 50000;
    eco.todayBonuses = 50000;
    eco.todayExpenses.fuel = 80000;
    eco.todayExpenses.food = 70000;
    eco.todayExpenses.rent = 50000; // Tiền phòng trọ
    eco.todayKmPassenger = 100;
    eco.todayKmEmpty = 20;
    eco.todayTrips = 25;
    eco.minutesOnlineToday = 600; // 10h

    const stats = createInitialStats();
    stats.dailyHoursSlept = 7;

    const { economy: nextEco, summary } = generateDailySummary(eco, 1, stats);

    expect(summary.grossRevenue).toBe(1100000);
    expect(summary.platformCommission).toBe(250000); // 25% of 1,000,000
    expect(summary.rentCost).toBe(50000);
    expect(summary.fuelCost).toBe(80000);
    expect(summary.foodCost).toBe(70000);
    expect(summary.vehicleWearEstimate).toBe(42000); // 120km * 350đ

    // Net profit = 1,100,000 - 250,000 - 80,000 - 70,000 - 0 - 42,000 - 50,000 = 608,000
    expect(summary.netProfit).toBe(608000);
    expect(summary.hourlyNetProfit).toBe(Math.round(608000 / 10)); // 60,800 đ/h
    expect(summary.tripsCount).toBe(25);

    // Verify next economy state is reset for the new day
    expect(nextEco.todayRevenue).toBe(0);
    expect(nextEco.todayExpenses.rent).toBe(0);
    expect(nextEco.todayExpenses.fuel).toBe(0);
    expect(nextEco.lastDaySummary).toEqual(summary);
  });
});
