import { EconomyState, DailySummary, CharacterStats } from './types';
import balanceData from '../../data/balance.json';

export function createInitialEconomy(): EconomyState {
  return {
    cash: balanceData.initialFinances.cash,
    appWallet: balanceData.initialFinances.appWallet,
    savings: 500000,
    debt: 0,
    todayRevenue: 0,
    todayTips: 0,
    todayBonuses: 0,
    todayCompensation: 0,
    todayExpenses: {
      food: 0,
      fuel: 0,
      maintenance: 0,
      fines: 0,
      other: 0,
    },
    todayTrips: 0,
    todayKmPassenger: 0,
    todayKmEmpty: 0,
    minutesOnlineToday: 0,
    lastDaySummary: null,
  };
}

export function generateDailySummary(
  economy: EconomyState,
  day: number,
  stats: CharacterStats
): { economy: EconomyState; summary: DailySummary } {
  const grossRevenue = economy.todayRevenue + economy.todayTips + economy.todayBonuses + economy.todayCompensation;
  
  // Platform commission estimated at ~25% of trip revenue
  const platformCommission = Math.round(economy.todayRevenue * 0.25);
  const fuelCost = economy.todayExpenses.fuel;
  const foodCost = economy.todayExpenses.food;
  const finesAndRepairs = economy.todayExpenses.maintenance + economy.todayExpenses.fines;
  
  // Estimated wear & depreciation per km: ~350 VND / km
  const totalKm = economy.todayKmPassenger + economy.todayKmEmpty;
  const vehicleWearEstimate = Math.round(totalKm * 350);

  const netProfit = grossRevenue - platformCommission - fuelCost - foodCost - finesAndRepairs - vehicleWearEstimate;
  
  const hoursOnline = Math.max(0.1, economy.minutesOnlineToday / 60);
  const hourlyNetProfit = Math.round(netProfit / hoursOnline);

  const summary: DailySummary = {
    day,
    grossRevenue,
    platformCommission,
    fuelCost,
    foodCost,
    finesAndRepairs,
    vehicleWearEstimate,
    netProfit,
    hourlyNetProfit,
    tripsCount: economy.todayTrips,
    kmDriven: totalKm,
    kmEmpty: economy.todayKmEmpty,
    hoursOnline,
    hoursSlept: stats.dailyHoursSlept,
  };

  const nextEconomy: EconomyState = {
    ...economy,
    todayRevenue: 0,
    todayTips: 0,
    todayBonuses: 0,
    todayCompensation: 0,
    todayExpenses: {
      food: 0,
      fuel: 0,
      maintenance: 0,
      fines: 0,
      other: 0,
    },
    todayTrips: 0,
    todayKmPassenger: 0,
    todayKmEmpty: 0,
    minutesOnlineToday: 0,
    lastDaySummary: summary,
  };

  return { economy: nextEconomy, summary };
}

