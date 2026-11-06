import { CharacterStats, GameTime, WeatherState, CoffeeCrashTimer } from './types';
import balanceData from '../../data/balance.json';

export interface StatDecayContext {
  isDriving: boolean;
  isWaitingForOrder: boolean;
  isResting: boolean;
  isSleeping: boolean;
  weather: WeatherState;
}

export function createInitialStats(): CharacterStats {
  return {
    stamina: balanceData.stats.stamina.initial,
    hunger: balanceData.stats.hunger.initial,
    alertness: balanceData.stats.alertness.initial,
    morale: balanceData.stats.morale.initial,
    sleepDebt: 0,
    baseFatigue: 0,
    health: 100,
    phoneBattery: 100,
    coffeeCountToday: 0,
    coffeeCrashes: [],
    lastNapMinute: null,
    dailyHoursSlept: 0,
  };
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Update stats per tick (1 minute game) based on player activity and environment.
 */
export function updateStatsPerMinute(
  stats: CharacterStats,
  time: GameTime,
  ctx: StatDecayContext
): { stats: CharacterStats; events: string[] } {
  const newStats: CharacterStats = { ...stats };
  const events: string[] = [];

  const hourFraction = 1 / 60;

  // 1. STAMINA
  if (ctx.isSleeping) {
    newStats.stamina += balanceData.stats.stamina.recoverSleepingPerHour * hourFraction;
  } else {
    let decayRate = balanceData.stats.stamina.decayRestingPerHour;
    if (ctx.isDriving) {
      decayRate = balanceData.stats.stamina.decayDrivingPerHour;
    } else if (ctx.isWaitingForOrder) {
      decayRate = balanceData.stats.stamina.decayWaitingPerHour;
    }

    if (ctx.weather.temperature >= 34) {
      decayRate += balanceData.stats.stamina.decayHotExtraPerHour;
    }
    if (ctx.weather.type === 'heavy_rain' || ctx.weather.type === 'storm') {
      decayRate += balanceData.stats.stamina.decayRainExtraPerHour;
    }

    newStats.stamina -= decayRate * hourFraction;
  }

  // 2. HUNGER
  if (!ctx.isSleeping) {
    newStats.hunger -= balanceData.stats.hunger.decayPerHour * hourFraction;
  } else {
    // Sleeping consumes less hunger
    newStats.hunger -= (balanceData.stats.hunger.decayPerHour * 0.4) * hourFraction;
  }

  // 3. ALERTNESS
  if (ctx.isSleeping) {
    newStats.alertness += balanceData.stats.alertness.recoverSleepingPerHour * hourFraction;
  } else {
    const isNight = time.hour >= 23 || time.hour < 5;
    const baseDecay = isNight
      ? balanceData.stats.alertness.decayNightPerHour
      : balanceData.stats.alertness.decayDayPerHour;
    
    // Sleep debt multiplier
    const sleepDebtMult = 1 + 0.15 * newStats.sleepDebt;
    newStats.alertness -= baseDecay * sleepDebtMult * hourFraction;
  }

  // Process coffee crashes
  const remainingCrashes = [];
  for (const crash of newStats.coffeeCrashes) {
    if (time.totalMinutes >= crash.triggerAtMinute) {
      newStats.alertness -= crash.penalty;
      events.push('Hết tác dụng cà phê / nước tăng lực! Cơn buồn ngủ ập đến dồn dập (-15 Tỉnh táo).');
    } else {
      remainingCrashes.push(crash);
    }
  }
  newStats.coffeeCrashes = remainingCrashes;

  // 4. MORALE
  if (newStats.hunger < balanceData.stats.hunger.criticalThreshold) {
    // Hungry penalty: -2/hour
    newStats.morale -= balanceData.stats.hunger.moralePenaltyPerHourWhenHungry * hourFraction;
  }

  // Clamping
  newStats.stamina = clamp(newStats.stamina, 0, 100);
  newStats.hunger = clamp(newStats.hunger, 0, 100);
  newStats.alertness = clamp(newStats.alertness, 0, 100);
  newStats.morale = clamp(newStats.morale, 0, 100);

  return { stats: newStats, events };
}

/**
 * Handle consuming food item.
 */
export function applyEatFood(
  stats: CharacterStats,
  hungerRestore: number,
  moraleRestore = 0
): CharacterStats {
  return {
    ...stats,
    hunger: clamp(stats.hunger + hungerRestore, 0, 100),
    morale: clamp(stats.morale + moraleRestore, 0, 100),
  };
}

/**
 * Handle drinking coffee or energy drink.
 */
export function applyDrinkCoffee(
  stats: CharacterStats,
  currentMinute: number,
  baseAlertnessBoost = 20,
  moraleBoost = 2
): { stats: CharacterStats; message: string } {
  const count = stats.coffeeCountToday + 1;
  // Tolerance from 3rd cup: -10% per additional cup
  const penaltyFactor = count >= 3 ? Math.max(0.4, 1.0 - (count - 2) * 0.1) : 1.0;
  const actualBoost = baseAlertnessBoost * penaltyFactor;

  // Crash scheduled 3 hours later (180 minutes)
  const crashTimer: CoffeeCrashTimer = {
    triggerAtMinute: currentMinute + 180,
    penalty: 15,
  };

  const newStats: CharacterStats = {
    ...stats,
    alertness: clamp(stats.alertness + actualBoost, 0, 100),
    morale: clamp(stats.morale + moraleBoost, 0, 100),
    coffeeCountToday: count,
    coffeeCrashes: [...stats.coffeeCrashes, crashTimer],
  };

  const message = count >= 3
    ? `Uống cữ thứ ${count} trong ngày. Do đã nhờn thuốc nên chỉ hồi được +${actualBoost.toFixed(1)} Tỉnh táo. Sau 3 giờ sẽ bị sụt pin!`
    : `Uống ly cà phê đá đậm đà! Đầu óc bừng tỉnh (+${actualBoost.toFixed(1)} Tỉnh táo). Cẩn thận sau 3 giờ sẽ thấm mệt.`;

  return { stats: newStats, message };
}

/**
 * Handle 20-minute power nap.
 * Effective once every 4 hours (240 minutes).
 */
export function applyPowerNap(
  stats: CharacterStats,
  currentMinute: number
): { stats: CharacterStats; success: boolean; message: string } {
  if (stats.lastNapMinute !== null && currentMinute - stats.lastNapMinute < 240) {
    const minutesLeft = 240 - (currentMinute - stats.lastNapMinute);
    return {
      stats,
      success: false,
      message: `Bạn vừa chợp mắt cách đây không lâu. Cần thêm ${minutesLeft} phút nữa mới có thể chợp mắt hiệu quả lại.`,
    };
  }

  const newStats: CharacterStats = {
    ...stats,
    stamina: clamp(stats.stamina + 5, 0, 100),
    alertness: clamp(stats.alertness + 15, 0, 100),
    lastNapMinute: currentMinute,
  };

  return {
    stats: newStats,
    success: true,
    message: 'Chợp mắt 20 phút bên ghế đá / trạm xăng: Tỉnh táo +15, Thể lực +5!',
  };
}

/**
 * Evaluate sleep debt and reset daily sleep counters when day rolls over (05:00).
 */
export function processDailySleepDebt(stats: CharacterStats): { stats: CharacterStats; message: string } {
  const hoursSlept = stats.dailyHoursSlept;
  let newSleepDebt = stats.sleepDebt;

  if (hoursSlept < 7) {
    const deficit = 7 - hoursSlept;
    newSleepDebt += deficit;
  } else if (hoursSlept > 7) {
    const excess = hoursSlept - 7;
    newSleepDebt = Math.max(0, newSleepDebt - excess * 0.5);
  }

  const message = hoursSlept >= 7
    ? `Tổng kết giấc ngủ: Đã ngủ ${hoursSlept.toFixed(1)}h (Đạt chuẩn 7h). Nợ ngủ hiện tại: ${newSleepDebt.toFixed(1)}h.`
    : `Cảnh báo thiếu ngủ: Hôm qua chỉ ngủ ${hoursSlept.toFixed(1)}h (Thiếu ${(7 - hoursSlept).toFixed(1)}h). Nợ ngủ tích lũy: ${newSleepDebt.toFixed(1)}h!`;

  return {
    stats: {
      ...stats,
      sleepDebt: newSleepDebt,
      dailyHoursSlept: 0,
      coffeeCountToday: 0,
    },
    message,
  };
}
