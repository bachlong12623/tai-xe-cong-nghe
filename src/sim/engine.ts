import { GameState, Action, LogMessage } from './types';
import { createRng } from './rng';
import { createInitialTime, advanceTime, formatGameTime, formatTime24h } from './time';
import {
  createInitialStats,
  updateStatsPerMinute,
  applyEatFood,
  applyDrinkCoffee,
  applyPowerNap,
  processDailySleepDebt,
} from './stats';
import { createInitialVehicle, refuelVehicle } from './vehicle';
import { createInitialEconomy, generateDailySummary } from './economy';
import { createInitialDriverApp } from './platform';
import { createInitialWeather, updateWeather } from './weather';
import itemsData from '../../data/items.json';
import spotsData from '../../data/spots.json';
import zonesData from '../../data/zones.json';

export function createGame(seed: number = Date.now()): GameState {
  const rng = createRng(seed);
  const time = createInitialTime();
  const stats = createInitialStats();
  const vehicle = createInitialVehicle();
  const economy = createInitialEconomy();
  const app = createInitialDriverApp();
  const weather = createInitialWeather();

  const initialLog: LogMessage = {
    id: 'log_0',
    minute: time.totalMinutes,
    timeFormatted: formatTime24h(time.hour, time.minute),
    text: 'Bắt đầu ngày mới tại TP.HCM. Bạn thức dậy lúc 05:00 sáng, sẵn sàng một ngày mưu sinh trên từng con phố!',
    type: 'info',
  };

  return {
    schemaVersion: 1,
    seed,
    rng,
    speed: 1,
    time,
    stats,
    vehicle,
    economy,
    app,
    location: {
      currentZoneId: 'q1',
      currentSpotId: 'nga_tu_trung_tam',
      isTraveling: false,
      targetZoneId: null,
      travelMinutesRemaining: 0,
      routeMode: 'fast',
    },
    weather,
    logs: [initialLog],
    isSleeping: false,
    sleepTargetMinutes: 0,
    isNapping: false,
    napRemainingMinutes: 0,
    currentActivityLabel: null,
    activeEvent: null,
  };
}

let logCounter = 1;
export function addLog(
  state: GameState,
  text: string,
  type: LogMessage['type'] = 'info'
): GameState {
  const newLog: LogMessage = {
    id: `log_${Date.now()}_${logCounter++}`,
    minute: state.time.totalMinutes,
    timeFormatted: formatTime24h(state.time.hour, state.time.minute),
    text,
    type,
  };
  // Keep last 100 logs
  const updatedLogs = [newLog, ...state.logs].slice(0, 100);
  return { ...state, logs: updatedLogs };
}

/**
 * Step simulation forward by 1 minute.
 */
export function stepOneMinute(state: GameState): GameState {
  let s = { ...state };

  // 1. Advance time
  const timeAdv = advanceTime(s.time, 1);
  s.time = timeAdv.newTime;

  // 2. Track online time
  if (s.app.isOnline && !s.isSleeping) {
    s.economy = {
      ...s.economy,
      minutesOnlineToday: s.economy.minutesOnlineToday + 1,
    };
  }

  // 3. Sleep & Nap processing
  if (s.isSleeping) {
    s.stats = {
      ...s.stats,
      dailyHoursSlept: s.stats.dailyHoursSlept + 1 / 60,
    };
    s.sleepTargetMinutes -= 1;
    if (s.sleepTargetMinutes <= 0) {
      s.isSleeping = false;
      s.currentActivityLabel = null;
      s.speed = 1;
      s = addLog(s, 'Đã thức dậy sau giấc ngủ hồi phục! Thể lực và tinh thần được tiếp thêm năng lượng.', 'success');
    }
  }

  if (s.isNapping) {
    s.napRemainingMinutes -= 1;
    if (s.napRemainingMinutes <= 0) {
      s.isNapping = false;
      s.currentActivityLabel = null;
      s.speed = 1;
      const napRes = applyPowerNap(s.stats, s.time.totalMinutes);
      s.stats = napRes.stats;
      s = addLog(s, napRes.message, 'success');
    }
  }

  // 4. Update stats decay/recovery
  const statRes = updateStatsPerMinute(s.stats, s.time, {
    isDriving: s.location.isTraveling,
    isWaitingForOrder: s.app.isOnline && !s.location.isTraveling && !s.isSleeping,
    isResting: !s.app.isOnline && !s.location.isTraveling && !s.isSleeping,
    isSleeping: s.isSleeping,
    weather: s.weather,
  });
  s.stats = statRes.stats;

  for (const evt of statRes.events) {
    s = addLog(s, evt, 'danger');
  }

  // 5. Hourly weather update
  if (s.time.minute === 0) {
    s.weather = updateWeather(s.weather, s.time.hour, s.rng);
  }

  // 6. Day cycle reset (05:00 every day)
  if (timeAdv.isNewDayStartHour && s.time.hour === 5 && s.time.minute === 0) {
    // Process sleep debt
    const sleepRes = processDailySleepDebt(s.stats);
    s.stats = sleepRes.stats;
    s = addLog(s, sleepRes.message, s.stats.sleepDebt > 5 ? 'warning' : 'info');

    // Generate daily financial summary
    const summaryRes = generateDailySummary(s.economy, s.time.day - 1, s.stats);
    s.economy = summaryRes.economy;
    const summary = summaryRes.summary;

    const summaryText = `[Tổng kết Ngày ${summary.day}]: Thu nhập thực: ${summary.netProfit.toLocaleString('vi-VN')}đ (${summary.hourlyNetProfit.toLocaleString('vi-VN')}đ/h online). Xăng: ${summary.fuelCost.toLocaleString('vi-VN')}đ, Ăn uống: ${summary.foodCost.toLocaleString('vi-VN')}đ.`;
    s = addLog(s, summaryText, summary.netProfit >= 0 ? 'success' : 'warning');
  }

  // 7. Critical stats notifications (throttled)
  if (s.time.minute % 30 === 0) {
    if (s.stats.alertness < 25) {
      s = addLog(s, '⚠️ Cực kỳ buồn ngủ (Tỉnh táo < 25%)! Bạn có nguy cơ ngủ gật giữa đường. Hãy chợp mắt hoặc uống cà phê!', 'danger');
    }
    if (s.stats.hunger < 20) {
      s = addLog(s, '⚠️ Đói cồn cào (No < 20%)! Tinh thần đang tụt nhanh. Hãy kiếm quán ăn!', 'warning');
    }
    if (s.stats.stamina < 20) {
      s = addLog(s, '⚠️ Cơ thể suy kiệt (Thể lực < 20%)! Tốc độ di chuyển giảm sút, hãy nghỉ ngơi.', 'warning');
    }
  }

  return s;
}

/**
 * Step simulation forward by N minutes.
 */
export function step(state: GameState, minutes: number): GameState {
  let current = state;
  for (let i = 0; i < minutes; i++) {
    current = stepOneMinute(current);
  }
  return current;
}

/**
 * Handle user actions.
 */
export function dispatch(state: GameState, action: Action): GameState {
  let s = { ...state };

  switch (action.t) {
    case 'SET_SPEED': {
      s.speed = action.speed;
      return s;
    }

    case 'GO_ONLINE': {
      if (s.isSleeping) {
        return addLog(s, 'Không thể bật app khi đang ngủ!', 'warning');
      }
      s.app = { ...s.app, isOnline: true };
      return addLog(s, '🟢 Đã bật ứng dụng tài xế: Sẵn sàng nhận cuốc!', 'success');
    }

    case 'GO_OFFLINE': {
      s.app = { ...s.app, isOnline: false };
      return addLog(s, '⚪ Đã tắt ứng dụng: Tạm dừng nhận cuốc.', 'info');
    }

    case 'EAT': {
      const food = itemsData.foods.find((f) => f.id === action.itemId);
      if (!food) return s;

      if (s.economy.cash < food.price) {
        return addLog(s, `Không đủ tiền mặt để mua ${food.name} (Cần ${food.price.toLocaleString('vi-VN')}đ)!`, 'danger');
      }

      // Deduct cash and track food expense
      s.economy = {
        ...s.economy,
        cash: s.economy.cash - food.price,
        todayExpenses: {
          ...s.economy.todayExpenses,
          food: s.economy.todayExpenses.food + food.price,
        },
      };

      // Apply stats
      s.stats = applyEatFood(s.stats, food.hungerRestore, food.moraleRestore);

      // Advance game time for eating
      s = step(s, food.durationMinutes);
      return addLog(s, `Đã ăn ${food.name} (-${food.price.toLocaleString('vi-VN')}đ, mất ${food.durationMinutes} phút): No +${food.hungerRestore}.`, 'success');
    }

    case 'DRINK': {
      const drink = itemsData.drinks.find((d) => d.id === action.itemId);
      if (!drink) return s;

      if (s.economy.cash < drink.price) {
        return addLog(s, `Không đủ tiền mặt để mua ${drink.name}!`, 'danger');
      }

      // Deduct cash
      s.economy = {
        ...s.economy,
        cash: s.economy.cash - drink.price,
        todayExpenses: {
          ...s.economy.todayExpenses,
          food: s.economy.todayExpenses.food + drink.price,
        },
      };

      if (drink.isCoffee) {
        const coffeeRes = applyDrinkCoffee(s.stats, s.time.totalMinutes, drink.alertnessRestore, drink.moraleRestore);
        s.stats = coffeeRes.stats;
        s = step(s, drink.durationMinutes);
        return addLog(s, coffeeRes.message, 'success');
      } else {
        s.stats = {
          ...s.stats,
          hunger: Math.min(100, s.stats.hunger + (drink.hungerRestore || 0)),
          morale: Math.min(100, s.stats.morale + (drink.moraleRestore || 0)),
        };
        s = step(s, drink.durationMinutes);
        return addLog(s, `Đã uống ${drink.name} (-${drink.price.toLocaleString('vi-VN')}đ).`, 'info');
      }
    }

    case 'SLEEP': {
      if (s.app.isOnline) {
        s.app = { ...s.app, isOnline: false };
      }
      const sleepMinutes = Math.round(action.hours * 60);
      s.isSleeping = true;
      s.sleepTargetMinutes = sleepMinutes;
      s.currentActivityLabel = `Đang ngủ (${action.hours} giờ)`;
      s.speed = 8; // Auto-accelerate when sleeping as specified
      return addLog(s, `Bạn về phòng trọ ngả lưng ngủ ${action.hours} tiếng để nạp lại năng lượng...`, 'info');
    }

    case 'NAP': {
      if (s.app.isOnline) {
        s.app = { ...s.app, isOnline: false };
      }
      if (s.stats.lastNapMinute !== null && s.time.totalMinutes - s.stats.lastNapMinute < 240) {
        const minLeft = 240 - (s.time.totalMinutes - s.stats.lastNapMinute);
        return addLog(s, `Vừa mới chợp mắt, chưa thể chợp mắt tiếp. Cần chờ ${minLeft} phút nữa.`, 'warning');
      }
      s.isNapping = true;
      s.napRemainingMinutes = 20;
      s.currentActivityLabel = 'Đang chợp mắt 20 phút...';
      s.speed = 8;
      return addLog(s, 'Tấp xe vào lề chợp mắt 20 phút...', 'info');
    }

    case 'WAKE_UP': {
      if (s.isSleeping) {
        s.isSleeping = false;
        s.currentActivityLabel = null;
        s.speed = 1;
        return addLog(s, 'Bạn tự thức dậy sớm trước giờ dự kiến.', 'info');
      }
      return s;
    }

    case 'REFUEL': {
      const refuelRes = refuelVehicle(s.vehicle, s.economy.cash, action.liters);
      if (refuelRes.error) {
        return addLog(s, refuelRes.error, 'warning');
      }
      s.vehicle = refuelRes.vehicle;
      s.economy = {
        ...s.economy,
        cash: s.economy.cash - refuelRes.cost,
        todayExpenses: {
          ...s.economy.todayExpenses,
          fuel: s.economy.todayExpenses.fuel + refuelRes.cost,
        },
      };
      // Refuel takes 5 minutes
      s = step(s, 5);
      return addLog(
        s,
        `Đã đổ ${refuelRes.litersAdded.toFixed(1)} lít xăng hết ${refuelRes.cost.toLocaleString('vi-VN')}đ. Bình xăng hiện tại: ${(s.vehicle.fuelCurrent / s.vehicle.fuelCapacity * 100).toFixed(0)}%.`,
        'success'
      );
    }

    case 'SET_SPOT': {
      const spot = spotsData.find((sp) => sp.id === action.spotId);
      s.location = {
        ...s.location,
        currentSpotId: action.spotId,
        currentZoneId: spot ? spot.zoneId : s.location.currentZoneId,
      };
      const spotName = spot ? spot.name : 'Lang thang tìm khách';
      return addLog(s, `Đã chọn điểm chờ: ${spotName}.`, 'info');
    }

    default:
      return s;
  }
}

export interface ViewModel {
  timeFormatted: string;
  hour: number;
  minute: number;
  day: number;
  dayOfWeekFormatted: string;
  speed: number;
  cashFormatted: string;
  appWalletFormatted: string;
  isOnline: boolean;
  activityLabel: string;
  stats: {
    stamina: number;
    hunger: number;
    alertness: number;
    morale: number;
    health: number;
    isStaminaLow: boolean;
    isHungerLow: boolean;
    isAlertnessLow: boolean;
    isMoraleLow: boolean;
  };
  vehicle: {
    name: string;
    fuelPercent: number;
    fuelLiters: number;
    odometerKm: number;
  };
  weather: {
    type: string;
    label: string;
    temperature: number;
    isRainy: boolean;
  };
  location: {
    zoneName: string;
    spotName: string;
  };
  logs: LogMessage[];
}

export function getView(state: GameState): ViewModel {
  const currentZone = zonesData.find((z) => z.id === state.location.currentZoneId);
  const currentSpot = spotsData.find((s) => s.id === state.location.currentSpotId);

  let weatherLabel = 'Trời nắng đẹp';
  if (state.weather.type === 'cloudy') weatherLabel = 'Nhiều mây mát mẻ';
  if (state.weather.type === 'light_rain') weatherLabel = 'Mưa lất phất';
  if (state.weather.type === 'heavy_rain') weatherLabel = 'Mưa rào nặng hạt';
  if (state.weather.type === 'storm') weatherLabel = 'Giông lốc lớn';

  return {
    timeFormatted: formatGameTime(state.time),
    hour: state.time.hour,
    minute: state.time.minute,
    day: state.time.day,
    dayOfWeekFormatted: formatGameTime(state.time).split(',')[0],
    speed: state.speed,
    cashFormatted: `${state.economy.cash.toLocaleString('vi-VN')} đ`,
    appWalletFormatted: `${state.economy.appWallet.toLocaleString('vi-VN')} đ`,
    isOnline: state.app.isOnline,
    activityLabel: state.currentActivityLabel || (state.app.isOnline ? 'Đang bật app chờ cuốc' : 'Nghỉ ngơi offline'),
    stats: {
      stamina: Math.round(state.stats.stamina),
      hunger: Math.round(state.stats.hunger),
      alertness: Math.round(state.stats.alertness),
      morale: Math.round(state.stats.morale),
      health: Math.round(state.stats.health),
      isStaminaLow: state.stats.stamina < 25,
      isHungerLow: state.stats.hunger < 20,
      isAlertnessLow: state.stats.alertness < 30,
      isMoraleLow: state.stats.morale < 30,
    },
    vehicle: {
      name: state.vehicle.name,
      fuelPercent: Math.round((state.vehicle.fuelCurrent / state.vehicle.fuelCapacity) * 100),
      fuelLiters: Number(state.vehicle.fuelCurrent.toFixed(1)),
      odometerKm: Math.round(state.vehicle.odometerKm),
    },
    weather: {
      type: state.weather.type,
      label: weatherLabel,
      temperature: state.weather.temperature,
      isRainy: state.weather.type === 'light_rain' || state.weather.type === 'heavy_rain' || state.weather.type === 'storm',
    },
    location: {
      zoneName: currentZone ? currentZone.name : 'TP.HCM',
      spotName: currentSpot ? currentSpot.name : 'Đang di chuyển',
    },
    logs: state.logs,
  };
}
