import { CharacterStats, GameTime, WeatherState, CoffeeCrashTimer } from './types';
import balanceData from '../../data/balance.json';

export interface StatDecayContext {
  isDriving: boolean;
  isWaitingForOrder: boolean;
  isResting: boolean;
  isSleeping: boolean;
  weather: WeatherState;
  isOnline?: boolean;
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
    isSick: false,
    sickDaysRemaining: 0,
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
    // Base fatigue reduces recovery efficiency from sleeping
    const fatigueFactor = Math.max(0.5, 1.0 - 0.005 * newStats.baseFatigue);
    newStats.stamina += balanceData.stats.stamina.recoverSleepingPerHour * fatigueFactor * hourFraction;
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

    // Sickness penalty: stamina decays 30% faster
    if (newStats.isSick) {
      decayRate *= 1.3;
    }

    newStats.stamina -= decayRate * hourFraction;
  }

  // 2. HUNGER
  if (!ctx.isSleeping) {
    newStats.hunger -= balanceData.stats.hunger.decayPerHour * hourFraction;
  } else {
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
    
    // Sleep debt penalty multiplier
    const sleepDebtMult = 1 + 0.15 * newStats.sleepDebt;
    newStats.alertness -= baseDecay * sleepDebtMult * hourFraction;
  }

  // Process coffee crashes
  const remainingCrashes: CoffeeCrashTimer[] = [];
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
    newStats.morale -= balanceData.stats.hunger.moralePenaltyPerHourWhenHungry * hourFraction;
  }

  // 5. PHONE BATTERY
  if (ctx.isOnline) {
    // 8% per hour when online GPS / maps
    newStats.phoneBattery = Math.max(0, newStats.phoneBattery - 8 * hourFraction);
  } else {
    // 1% per hour in standby
    newStats.phoneBattery = Math.max(0, newStats.phoneBattery - 1 * hourFraction);
  }

  // 6. HEALTH DEGRADATION
  // Drenching in heavy rain while driving: -3 health/hour
  if (ctx.isDriving && (ctx.weather.type === 'heavy_rain' || ctx.weather.type === 'storm')) {
    newStats.health = Math.max(0, newStats.health - 3 * hourFraction);
  }

  // Starving severely (hunger < 10): -2 health/hour
  if (newStats.hunger < 10) {
    newStats.health = Math.max(0, newStats.health - 2 * hourFraction);
  }

  // Trigger Sickness if health drops below 40
  if (newStats.health < 40 && !newStats.isSick) {
    newStats.isSick = true;
    newStats.sickDaysRemaining = 2;
    events.push('🚨 Bạn đã bị ốm sốt nặng do làm việc quá sức và dầm mưa gió (Sức khỏe < 40%)! Cần nghỉ ngơi mua thuốc uống.');
  }

  // Clamping
  newStats.stamina = clamp(newStats.stamina, 0, 100);
  newStats.hunger = clamp(newStats.hunger, 0, 100);
  newStats.alertness = clamp(newStats.alertness, 0, 100);
  newStats.morale = clamp(newStats.morale, 0, 100);
  newStats.health = clamp(newStats.health, 0, 100);
  newStats.baseFatigue = clamp(newStats.baseFatigue, 0, 100);

  return { stats: newStats, events };
}

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

export function applyDrinkCoffee(
  stats: CharacterStats,
  currentMinute: number,
  baseAlertnessBoost = 20,
  moraleBoost = 2
): { stats: CharacterStats; message: string } {
  const count = stats.coffeeCountToday + 1;
  const penaltyFactor = count >= 3 ? Math.max(0.4, 1.0 - (count - 2) * 0.1) : 1.0;
  const actualBoost = baseAlertnessBoost * penaltyFactor;

  // Excessive caffeine takes a toll on long term health from 3rd cup
  const healthPenalty = count >= 3 ? 2 : 0;

  const crashTimer: CoffeeCrashTimer = {
    triggerAtMinute: currentMinute + 180,
    penalty: 15,
  };

  const newStats: CharacterStats = {
    ...stats,
    alertness: clamp(stats.alertness + actualBoost, 0, 100),
    morale: clamp(stats.morale + moraleBoost, 0, 100),
    health: clamp(stats.health - healthPenalty, 0, 100),
    coffeeCountToday: count,
    coffeeCrashes: [...stats.coffeeCrashes, crashTimer],
  };

  const message = count >= 3
    ? `Uống cữ thứ ${count} trong ngày. Do đã nhờn thuốc nên chỉ hồi được +${actualBoost.toFixed(1)} Tỉnh táo và hại sức khỏe (-2 Sức khỏe). Sau 3 giờ sẽ bị sụt pin!`
    : `Uống ly cà phê đá đậm đà! Đầu óc bừng tỉnh (+${actualBoost.toFixed(1)} Tỉnh táo). Cẩn thận sau 3 giờ sẽ thấm mệt.`;

  return { stats: newStats, message };
}

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

export function processDailySleepDebt(
  stats: CharacterStats,
  hoursOnlineYesterday = 8
): { stats: CharacterStats; message: string } {
  const hoursSlept = stats.dailyHoursSlept;
  let newSleepDebt = stats.sleepDebt;
  let newFatigue = stats.baseFatigue;
  let newHealth = stats.health;

  // 1. Sleep Debt evaluation
  if (hoursSlept < 7) {
    const deficit = 7 - hoursSlept;
    newSleepDebt += deficit;
  } else if (hoursSlept > 7) {
    const excess = hoursSlept - 7;
    newSleepDebt = Math.max(0, newSleepDebt - excess * 0.5);
  }

  // 2. Base fatigue accumulation: working > 10 hours
  if (hoursOnlineYesterday >= 12) {
    newFatigue = Math.min(100, newFatigue + 10);
  } else if (hoursOnlineYesterday >= 10) {
    newFatigue = Math.min(100, newFatigue + 5);
  } else if (hoursOnlineYesterday <= 4) {
    newFatigue = Math.max(0, newFatigue - 10); // Rest day relieves fatigue
  }

  // 3. Chronic sleep debt damages health
  if (newSleepDebt >= 10) {
    newHealth = Math.max(0, newHealth - 3);
  }

  // 4. Sickness resolution
  let isSick = stats.isSick;
  let sickDays = stats.sickDaysRemaining;
  if (isSick) {
    sickDays -= 1;
    if (sickDays <= 0) {
      isSick = false;
      newHealth = Math.min(100, newHealth + 25);
    }
  }

  const message = hoursSlept >= 7
    ? `Tổng kết giấc ngủ: Đã ngủ ${hoursSlept.toFixed(1)}h (Đạt chuẩn 7h). Nợ ngủ: ${newSleepDebt.toFixed(1)}h. Mệt nền: ${newFatigue}%.`
    : `Cảnh báo thiếu ngủ: Hôm qua chỉ ngủ ${hoursSlept.toFixed(1)}h (Thiếu ${(7 - hoursSlept).toFixed(1)}h). Nợ ngủ: ${newSleepDebt.toFixed(1)}h. Mệt nền: ${newFatigue}%!`;

  return {
    stats: {
      ...stats,
      sleepDebt: newSleepDebt,
      baseFatigue: newFatigue,
      health: newHealth,
      isSick,
      sickDaysRemaining: sickDays,
      dailyHoursSlept: 0,
      coffeeCountToday: 0,
    },
    message,
  };
}
