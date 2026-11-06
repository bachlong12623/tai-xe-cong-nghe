import { GameState, Action, LogMessage, DailySummary } from './types';
import { createRng, nextFloat, nextInt } from './rng';
import { createInitialTime, advanceTime, formatGameTime, formatTime24h } from './time';
import {
  createInitialStats,
  updateStatsPerMinute,
  applyEatFood,
  applyDrinkCoffee,
  processDailySleepDebt,
} from './stats';
import {
  createInitialVehicle,
  createVehicle,
  refuelVehicle,
  swapBattery,
  chargeBattery,
  degradeVehicleParts,
  repairVehiclePart,
} from './vehicle';
import { createInitialEconomy, generateDailySummary } from './economy';
import { createInitialDriverApp, evaluateDriverTier, checkAccountStatus } from './platform';
import { createInitialWeather, updateWeather } from './weather';
import {
  TripOrder,
  generateOrderOffer,
  evaluateOrderArrivalProbability,
} from './orders';
import {
  calculateTravelTimeMinutes,
  calculateFuelConsumed,
  calculateTravelDistance,
  rollForAccident,
} from './traffic';
import {
  evaluateRandomEventTrigger,
  applyEventOption,
} from './events';
import {
  createDefaultSkills,
  addSkillExp,
  getTravelTimeMultiplier,
  getTipChanceBonus,
  getAccidentRiskMultiplier,
  getFoodDamageReduction,
  getMoraleLossReduction,
} from './skills';
import { getActiveCsgtZones, maybeGenerateNpcMessage } from './npc';
import { checkPoliceViolation } from './violations';
import { createDefaultGoal, createDefaultLoan, contributeGoal } from './goals';
import { evaluateAchievements } from './achievements';
import itemsData from '../../data/items.json';
import spotsData from '../../data/spots.json';
import zonesData from '../../data/zones.json';
import goalsData from '../../data/goals.json';
import vehiclesData from '../../data/vehicles.json';

export function createGame(seed: number = Date.now()): GameState {
  const rng = createRng(seed);
  const time = createInitialTime();
  const stats = createInitialStats();
  const vehicle = createInitialVehicle();
  const economy = createInitialEconomy();
  const app = createInitialDriverApp();
  const weather = createInitialWeather();
  const skills = createDefaultSkills();
  const goal = createDefaultGoal();
  const loan = createDefaultLoan();

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
    ownedVehicles: [vehicle],
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
    activeAccident: null,
    showDailySummaryModal: false,
    pendingSummary: null,
    recentEventCooldowns: {},
    // Milestone 5
    drivingStyle: 'normal',
    skills,
    npcMessages: [],
    activeCsgtZones: ['q1', 'tan_binh'],
    activePoliceFine: null,
    goal,
    loan,
    // Milestone 6
    difficulty: 'normal',
    unlockedAchievements: [],
    isTetSeason: false,
    choseTetHome: null,
    historySummaries: [],
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
  const updatedLogs = [newLog, ...state.logs].slice(0, 100);
  return { ...state, logs: updatedLogs };
}

/**
 * Advance an active trip by 1 minute with wear, fuel, CSGT violation, and accident checks.
 */
function advanceActiveTrip(state: GameState): GameState {
  let s = { ...state };
  if (!s.app.activeTrip) return s;

  const trip = { ...s.app.activeTrip };
  const isMoving = trip.stage === 'TO_PICKUP' || trip.stage === 'TO_DROPOFF';

  if (isMoving) {
    const baseDistance = trip.stage === 'TO_PICKUP' ? trip.pickupDistanceKm : trip.tripDistanceKm;
    const actualDistance = calculateTravelDistance(baseDistance, s.location.routeMode);

    const minutesDiv = Math.max(1, trip.stageMinutesRemaining);
    const kmThisMinute = actualDistance / minutesDiv;

    // Fuel or Battery consumption
    if (s.vehicle.fuelType === 'electric') {
      const batteryUsed = kmThisMinute * 1.25; // ~1.25% battery per km
      s.vehicle = {
        ...s.vehicle,
        fuelCurrent: Math.max(0, s.vehicle.fuelCurrent - batteryUsed),
        odometerKm: s.vehicle.odometerKm + kmThisMinute,
      };
      if (s.vehicle.fuelCurrent <= 10) {
        s = addLog(s, `⚠️ Pin xe điện chỉ còn ${Math.round(s.vehicle.fuelCurrent)}%! Cần ghé trạm đổi pin kẻo dắt bộ.`, 'danger');
      }
    } else {
      const fuelRate = s.vehicle.category === 'car' ? 6.5 : 1.9;
      const fuelUsed = calculateFuelConsumed(kmThisMinute, fuelRate);
      s.vehicle = {
        ...s.vehicle,
        fuelCurrent: Math.max(0, s.vehicle.fuelCurrent - fuelUsed),
        odometerKm: s.vehicle.odometerKm + kmThisMinute,
      };
      if (s.vehicle.fuelCurrent <= 0.2) {
        s = addLog(s, '⚠️ Cảnh báo: Kim xăng đã về vạch đỏ! Cần tìm cây xăng gấp kẻo chết máy đẩy bộ.', 'danger');
      }
    }

    // Degrade 5 parts
    s.vehicle = degradeVehicleParts(s.vehicle, kmThisMinute);

    s.economy = {
      ...s.economy,
      todayKmPassenger: s.economy.todayKmPassenger + kmThisMinute,
    };

    // CSGT violation check when driving rush / shortcut
    if (s.drivingStyle === 'rush' || s.drivingStyle === 'shortcut') {
      const timeFormatted = formatTime24h(s.time.hour, s.time.minute);
      const policeFine = checkPoliceViolation(
        s.rng,
        s.drivingStyle,
        s.location.currentZoneId,
        s.activeCsgtZones,
        timeFormatted
      );

      if (policeFine) {
        s.activePoliceFine = policeFine;
        s.speed = 0; // Pause game for police fine notification
        const fine = policeFine.fineAmount;

        if (s.economy.cash >= fine) {
          s.economy.cash -= fine;
        } else {
          s.economy.appWallet -= fine;
        }
        s.economy.todayExpenses.fines += fine;

        const moraleReduction = getMoraleLossReduction(s.skills);
        const moraleLoss = Math.round(15 * (1 - moraleReduction));
        s.stats.morale = Math.max(0, s.stats.morale - moraleLoss);

        s = addLog(
          s,
          `🚨 BỊ CSGT THỔI PHẠT: ${policeFine.reason}! Mức phạt: ${fine.toLocaleString('vi-VN')}đ. Tinh thần -${moraleLoss}.`,
          'danger'
        );
        return s;
      }
    }

    // Accident check while driving (modified by defensive driving skill and driving style)
    const accidentMultiplier = getAccidentRiskMultiplier(s.skills, s.drivingStyle);
    const accident = rollForAccident(
      s.stats.alertness,
      s.vehicle.condition,
      s.weather,
      s.time,
      s.rng,
      accidentMultiplier
    );

    if (accident) {
      s.activeAccident = accident;
      s.speed = 0; // Pause game for accident resolution

      // Apply penalties
      s.economy = {
        ...s.economy,
        cash: Math.max(0, s.economy.cash - (accident.repairCost + accident.medicalCost)),
        todayExpenses: {
          ...s.economy.todayExpenses,
          maintenance: s.economy.todayExpenses.maintenance + accident.repairCost,
          fines: s.economy.todayExpenses.fines + accident.medicalCost,
        },
      };

      const moraleLoss = Math.round(accident.moralePenalty * (1 - getMoraleLossReduction(s.skills)));
      s.stats = {
        ...s.stats,
        health: Math.max(0, s.stats.health - accident.healthPenalty),
        morale: Math.max(0, s.stats.morale - moraleLoss),
      };

      // Trip cancelled due to accident
      s.app = { ...s.app, activeTrip: null };
      s.currentActivityLabel = null;

      s = addLog(
        s,
        `💥 TAI NẠN: ${accident.title}! Chi phí sửa chữa & y tế: ${(accident.repairCost + accident.medicalCost).toLocaleString('vi-VN')}đ. Sức khỏe -${accident.healthPenalty}.`,
        'danger'
      );
      return s;
    }
  }

  trip.stageMinutesRemaining -= 1;

  if (trip.stageMinutesRemaining <= 0) {
    const travelMult = getTravelTimeMultiplier(s.skills, s.drivingStyle);

    if (trip.stage === 'TO_PICKUP') {
      if (trip.type === 'food') {
        trip.stage = 'AT_MERCHANT_WAITING';
        trip.stageMinutesRemaining = trip.merchantPrepMinutes || 7;
        s.currentActivityLabel = `Chờ quán làm món (${trip.foodItems})`;
        s = addLog(s, `Đã đến quán ăn! Đang đợi chuẩn bị món (${trip.foodItems}), dự kiến ${trip.stageMinutesRemaining} phút...`, 'info');
      } else {
        trip.stage = 'TO_DROPOFF';
        const baseMins = calculateTravelTimeMinutes(
          trip.tripDistanceKm,
          30,
          s.time,
          s.weather,
          s.stats.stamina,
          s.location.routeMode
        );
        const travelMins = Math.max(2, Math.round(baseMins * travelMult));
        trip.stageMinutesRemaining = travelMins;
        const dropZone = zonesData.find((z) => z.id === trip.dropoffZoneId);
        s.currentActivityLabel = `Chở ${trip.customerName} đến ${dropZone?.name || 'điểm trả'}`;
        s = addLog(s, `Đã đón khách ${trip.customerName} (${trip.customerProfile.label})! Bắt đầu di chuyển đến điểm trả (~${travelMins} phút)...`, 'info');
      }
    } else if (trip.stage === 'AT_MERCHANT_WAITING') {
      trip.stage = 'TO_DROPOFF';
      const baseMins = calculateTravelTimeMinutes(
        trip.tripDistanceKm,
        30,
        s.time,
        s.weather,
        s.stats.stamina,
        s.location.routeMode
      );
      const travelMins = Math.max(2, Math.round(baseMins * travelMult));
      trip.stageMinutesRemaining = travelMins;
      const dropZone = zonesData.find((z) => z.id === trip.dropoffZoneId);
      s.currentActivityLabel = `Giao đồ ăn tới ${dropZone?.name || 'khách'}`;
      s = addLog(s, `Quán đã giao món (${trip.foodItems}) xong! Bắt đầu di chuyển giao cho khách hàng (~${travelMins} phút)...`, 'info');
    } else if (trip.stage === 'TO_DROPOFF') {
      trip.stage = 'COMPLETED';
      s.currentActivityLabel = null;
      s.location.currentZoneId = trip.dropoffZoneId;

      const gross = trip.grossFare;
      const comm = trip.platformCommission;
      const net = trip.netFare;

      if (trip.paymentMethod === 'cash') {
        s.economy = {
          ...s.economy,
          cash: s.economy.cash + gross,
          appWallet: s.economy.appWallet - comm,
          todayRevenue: s.economy.todayRevenue + gross,
          todayTrips: s.economy.todayTrips + 1,
        };
      } else {
        s.economy = {
          ...s.economy,
          appWallet: s.economy.appWallet + net,
          todayRevenue: s.economy.todayRevenue + gross,
          todayTrips: s.economy.todayTrips + 1,
        };
      }

      // Check food fragile damage (mitigated by itemHandling skill)
      if (trip.type === 'food' && trip.isFragile && s.drivingStyle !== 'safe') {
        const baseSpillChance = s.drivingStyle === 'shortcut' ? 0.15 : 0.05;
        const spillChance = Math.max(0.01, baseSpillChance * (1 - getFoodDamageReduction(s.skills)));
        if (nextFloat(s.rng) < spillChance) {
          s.economy.cash = Math.max(0, s.economy.cash - 40000);
          s.economy.todayExpenses.other += 40000;
          s.stats.morale = Math.max(0, s.stats.morale - 6);
          s = addLog(s, `🍜 Hộp thức ăn (${trip.foodItems}) bị xô đổ! Bạn phải tự đền 40.000đ cho khách.`, 'warning');
        }
      }

      // Car toll fee at airport
      if (s.vehicle.category === 'car' && trip.dropoffZoneId === 'tan_binh') {
        s.economy.cash = Math.max(0, s.economy.cash - 15000);
        s.economy.todayExpenses.other += 15000;
        s = addLog(s, 'Thu phí vào bãi sân bay Tân Sơn Nhất cho ô tô: -15.000đ.', 'info');
      }

      // Tip calculation (boosted by communication skill)
      let tipAmount = 0;
      const tipChance = trip.customerProfile.tipChance + getTipChanceBonus(s.skills);
      if (nextFloat(s.rng) < tipChance) {
        tipAmount = Math.round(nextInt(s.rng, trip.customerProfile.tipMin, trip.customerProfile.tipMax) / 1000) * 1000;
        s.economy.cash += tipAmount;
        s.economy.todayTips += tipAmount;
        s.stats.morale = Math.min(100, s.stats.morale + 3);
      }

      // Rating awarded
      const ratingStars = 5;
      const updatedHistory = [...s.app.ratingHistory.slice(1), ratingStars];
      const avgRating = updatedHistory.reduce((a, b) => a + b, 0) / updatedHistory.length;

      // Tier evaluation
      const currentTier = evaluateDriverTier(s.app.totalTripsCompleted + 1, Number(avgRating.toFixed(2)));
      if (currentTier !== s.app.tier) {
        s.app = { ...s.app, tier: currentTier };
        s = addLog(s, `🎖️ Chúc mừng! Bạn đã thăng hạng tài xế lên ${currentTier.toUpperCase()}!`, 'success');
      }

      s.app = {
        ...s.app,
        ratingHistory: updatedHistory,
        rating: Number(avgRating.toFixed(2)),
        totalTripsCompleted: s.app.totalTripsCompleted + 1,
        activeTrip: null,
      };

      // Award Skill EXP
      const timeFormatted = formatTime24h(s.time.hour, s.time.minute);
      s.skills = addSkillExp(s.skills, 'streetKnowledge', 8, s.logs, s.time.totalMinutes, timeFormatted);
      s.skills = addSkillExp(s.skills, 'defensiveDriving', 5, s.logs, s.time.totalMinutes, timeFormatted);
      if (trip.type === 'food') {
        s.skills = addSkillExp(s.skills, 'itemHandling', 12, s.logs, s.time.totalMinutes, timeFormatted);
      } else {
        s.skills = addSkillExp(s.skills, 'communication', tipAmount > 0 ? 15 : 8, s.logs, s.time.totalMinutes, timeFormatted);
      }
      if (s.weather.type === 'heavy_rain' || s.weather.type === 'storm' || trip.isPeakHour) {
        s.skills = addSkillExp(s.skills, 'stressResilience', 6, s.logs, s.time.totalMinutes, timeFormatted);
      }

      const payNote = trip.paymentMethod === 'cash'
        ? `Nhận tiền mặt +${gross.toLocaleString('vi-VN')}đ (ví app trừ hoa hồng -${comm.toLocaleString('vi-VN')}đ)`
        : `Thanh toán thẻ/ví điện tử: ví app cộng +${net.toLocaleString('vi-VN')}đ`;

      const tipNote = tipAmount > 0 ? ` Được khách tip thêm +${tipAmount.toLocaleString('vi-VN')}đ! 🎉` : '';
      s = addLog(s, `✅ Hoàn thành cuốc ${trip.title}! Thu nhập thực nhận: ${net.toLocaleString('vi-VN')}đ. ${payNote}.${tipNote}`, 'success');
      return s;
    }
  }

  s.app = { ...s.app, activeTrip: trip };
  return s;
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
      stamina: Math.min(100, s.stats.stamina + 12 / 60),
      alertness: Math.min(100, s.stats.alertness + 14 / 60),
      hunger: Math.max(0, s.stats.hunger - 2 / 60),
      dailyHoursSlept: s.stats.dailyHoursSlept + 1 / 60,
    };
    s.sleepTargetMinutes -= 1;
    if (s.sleepTargetMinutes <= 0) {
      s.isSleeping = false;
      s.currentActivityLabel = null;
      s.speed = 1;
      s = addLog(s, 'Bạn đã thức dậy sau giấc ngủ say. Thể lực và Tỉnh táo đã phục hồi đáng kể!', 'success');
    }
  } else if (s.isNapping) {
    s.stats = {
      ...s.stats,
      stamina: Math.min(100, s.stats.stamina + 5 / 20),
      alertness: Math.min(100, s.stats.alertness + 15 / 20),
    };
    s.napRemainingMinutes -= 1;
    if (s.napRemainingMinutes <= 0) {
      s.isNapping = false;
      s.stats.lastNapMinute = s.time.totalMinutes;
      s.currentActivityLabel = null;
      s.speed = 1;
      s = addLog(s, 'Chợp mắt xong 20 phút! Đầu óc tỉnh táo lại đôi chút để tiếp tục cuốc xe.', 'success');
    }
  } else {
    // 4. Update stats normally
    const isDriving = s.app.activeTrip !== null || s.location.isTraveling;
    const isWaiting = s.app.isOnline && !isDriving;
    const statsRes = updateStatsPerMinute(s.stats, s.time, {
      isDriving,
      isWaitingForOrder: isWaiting,
      isResting: !s.app.isOnline,
      isSleeping: false,
      weather: s.weather,
      isOnline: s.app.isOnline,
    });
    s.stats = statsRes.stats;
  }

  // 5. Day cycle reset (05:00 every day)
  if (timeAdv.isNewDayStartHour && s.time.hour === 5 && s.time.minute === 0) {
    const hoursOnlineYesterday = s.economy.minutesOnlineToday / 60;
    const sleepRes = processDailySleepDebt(s.stats, hoursOnlineYesterday);
    s.stats = sleepRes.stats;

    if (sleepRes.message) {
      s = addLog(s, sleepRes.message, s.stats.sleepDebt > 5 ? 'warning' : 'info');
    }

    // Daily loan interest and installment payment
    if (s.loan.totalPrincipal > 0) {
      const dailyInterest = Math.round(s.loan.totalPrincipal * s.loan.dailyInterestRate);
      s.loan = { ...s.loan, totalPrincipal: s.loan.totalPrincipal + dailyInterest };

      const minPay = Math.min(50000, s.loan.totalPrincipal);
      if (s.economy.cash >= minPay) {
        s.economy.cash -= minPay;
        s.loan.totalPrincipal -= minPay;
        s = addLog(s, `🏦 Trả góp xe định kỳ hôm nay: -${minPay.toLocaleString('vi-VN')}đ (Dư nợ còn: ${s.loan.totalPrincipal.toLocaleString('vi-VN')}đ).`, 'info');
      } else if (s.economy.appWallet >= minPay) {
        s.economy.appWallet -= minPay;
        s.loan.totalPrincipal -= minPay;
        s = addLog(s, `🏦 Trích ví app thanh toán trả góp xe: -${minPay.toLocaleString('vi-VN')}đ (Dư nợ còn: ${s.loan.totalPrincipal.toLocaleString('vi-VN')}đ).`, 'info');
      } else {
        s.loan.daysOverdue += 1;
        s = addLog(s, '⚠️ Không đủ tiền trả góp xe 50.000đ hôm nay! Đã bị ghi nợ quá hạn.', 'warning');
      }
    }

    const summaryRes = generateDailySummary(s.economy, s.time.day - 1, s.stats);
    s.economy = summaryRes.economy;
    const summary = summaryRes.summary;

    s.showDailySummaryModal = true;
    s.pendingSummary = summary;
    s.historySummaries = [...s.historySummaries, summary].slice(-30);
    s.speed = 0;

    const summaryText = `[Tổng kết Ngày ${summary.day}]: Thu nhập thực: ${summary.netProfit.toLocaleString('vi-VN')}đ (${summary.hourlyNetProfit.toLocaleString('vi-VN')}đ/h online). Xăng: ${summary.fuelCost.toLocaleString('vi-VN')}đ, Ăn uống: ${summary.foodCost.toLocaleString('vi-VN')}đ.`;
    s = addLog(s, summaryText, summary.netProfit >= 0 ? 'success' : 'warning');
  }

  // Check Tết season (Days 25-33)
  if (s.time.day >= 25 && s.time.day <= 33) {
    s.isTetSeason = true;
  }

  // Check achievements every 15 minutes
  if (s.time.minute % 15 === 0) {
    const achRes = evaluateAchievements(s);
    if (achRes.unlockedNewIds.length > 0) {
      s.unlockedAchievements = [...s.unlockedAchievements, ...achRes.unlockedNewIds];
      s.logs = [...achRes.logsToAdd, ...s.logs].slice(0, 100);
      s.stats.morale = Math.min(100, s.stats.morale + 5 * achRes.unlockedNewIds.length);
    }
  }

  // 6. CSGT checkpoint rotation & NPC news every hour / 30m
  if (s.time.minute === 0) {
    s.activeCsgtZones = getActiveCsgtZones(s.rng, s.time.hour);
  }

  const newNpcMsg = maybeGenerateNpcMessage(s.rng, s.time, s.weather, s.activeCsgtZones, s.npcMessages);
  if (newNpcMsg) {
    s.npcMessages = [newNpcMsg, ...s.npcMessages].slice(0, 30);
  }

  // 7. Update weather every 60 minutes
  if (s.time.minute === 0) {
    s.weather = updateWeather(s.weather, s.time.hour, s.rng);
  }

  // 8. Relocation travel
  if (s.location.isTraveling) {
    s.location.travelMinutesRemaining -= 1;
    // Travel fuel/wear
    const kmMin = 0.4;
    if (s.vehicle.fuelType === 'electric') {
      s.vehicle = {
        ...s.vehicle,
        fuelCurrent: Math.max(0, s.vehicle.fuelCurrent - (kmMin * 1.25)),
        odometerKm: s.vehicle.odometerKm + kmMin,
      };
    } else {
      const fuelRate = s.vehicle.category === 'car' ? 6.5 : 1.9;
      s.vehicle = {
        ...s.vehicle,
        fuelCurrent: Math.max(0, s.vehicle.fuelCurrent - calculateFuelConsumed(kmMin, fuelRate)),
        odometerKm: s.vehicle.odometerKm + kmMin,
      };
    }
    s.vehicle = degradeVehicleParts(s.vehicle, kmMin);
    s.economy.todayKmEmpty += kmMin;

    if (s.location.travelMinutesRemaining <= 0) {
      s.location.isTraveling = false;
      if (s.location.targetZoneId) {
        s.location.currentZoneId = s.location.targetZoneId;
        s.location.targetZoneId = null;
      }
      s.currentActivityLabel = null;
      const targetZone = zonesData.find((z) => z.id === s.location.currentZoneId);
      s = addLog(s, `Đã đến khu vực: ${targetZone?.name || 'Điểm mới'}.`, 'info');
    }
  }

  // 9. Advance active trip
  if (s.app.activeTrip) {
    s = advanceActiveTrip(s);
  }

  // 10. Order Dispatching
  if (s.app.isOnline && !s.app.activeTrip && !s.location.isTraveling && !s.isSleeping && !s.stats.isSick) {
    if (s.app.currentOffer) {
      // Countdown tick is handled by UI / action
    } else {
      const isCooldown = s.app.cooldownUntilMinute !== null && s.time.totalMinutes < s.app.cooldownUntilMinute;
      if (!isCooldown) {
        const currentSpot = spotsData.find((sp) => sp.id === s.location.currentSpotId);
        const densityMult = currentSpot?.density === 'high' ? 1.3 : currentSpot?.density === 'low' ? 0.7 : 1.0;
        const arrivalProb = evaluateOrderArrivalProbability(s.time, s.weather, s.app, s.location.currentZoneId, s.rng, densityMult);

        if (nextFloat(s.rng) < arrivalProb) {
          const newOffer = generateOrderOffer(
            s.rng,
            s.time,
            s.weather,
            s.app,
            s.location.currentZoneId,
            s.vehicle.category
          );
          s.app = { ...s.app, currentOffer: newOffer };
          s.speed = 1;
          s = addLog(s, `🔔 Nổ cuốc mới! [${newOffer.type === 'food' ? 'Giao đồ ăn' : 'Chở khách'}] - Cước: ${newOffer.grossFare.toLocaleString('vi-VN')}đ (Đếm ngược 12s)`, 'event');
        }
      }
    }
  }

  // 11. Random Events Evaluation
  if (!s.activeEvent && !s.activeAccident && !s.activePoliceFine && !s.showDailySummaryModal) {
    const randomEvent = evaluateRandomEventTrigger(s, s.rng);
    if (randomEvent) {
      s.activeEvent = randomEvent;
      s.speed = 0; // Pause for event choice
      s = addLog(s, `⚡ SỰ KIỆN: ${randomEvent.name}! Hãy đưa ra lựa chọn xử lý tình huống.`, 'event');
    }
  }

  // 12. Critical stats warnings (throttled)
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
    if (s.stats.phoneBattery < 15 && s.stats.phoneBattery > 0) {
      s = addLog(s, `🪫 Pin điện thoại chỉ còn ${Math.round(s.stats.phoneBattery)}%! Cần tìm chỗ sạc gấp.`, 'warning');
    }
  }

  return s;
}

export function step(state: GameState, minutes: number): GameState {
  let current = state;
  for (let i = 0; i < minutes; i++) {
    current = stepOneMinute(current);
  }
  return current;
}

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
      if (s.stats.isSick) {
        return addLog(s, 'Bạn đang bị ốm sốt nặng! Cơ thể không đủ sức chạy xe ngoài đường lúc này.', 'danger');
      }
      if (s.stats.phoneBattery <= 0) {
        return addLog(s, 'Điện thoại đã hết pin (0%)! Không thể bật ứng dụng.', 'danger');
      }
      if (s.app.suspendedUntilMinute !== null) {
        if (s.time.totalMinutes < s.app.suspendedUntilMinute) {
          const hoursLeft = ((s.app.suspendedUntilMinute - s.time.totalMinutes) / 60).toFixed(1);
          return addLog(s, `Tài khoản đang bị tạm khóa (còn ${hoursLeft}h nữa mới mở khóa)!`, 'danger');
        } else {
          s.app = { ...s.app, suspendedUntilMinute: null };
        }
      }
      s.app = { ...s.app, isOnline: true };
      return addLog(s, '🟢 Đã bật ứng dụng tài xế: Sẵn sàng nhận cuốc!', 'success');
    }

    case 'GO_OFFLINE': {
      s.app = { ...s.app, isOnline: false, currentOffer: null };
      return addLog(s, '⚪ Đã tắt ứng dụng: Tạm dừng nhận cuốc.', 'info');
    }

    case 'ACCEPT_OFFER': {
      if (!s.app.currentOffer || s.app.currentOffer.id !== action.id) {
        return s;
      }
      const trip = { ...s.app.currentOffer };
      const travelMult = getTravelTimeMultiplier(s.skills, s.drivingStyle);
      const basePickupTime = calculateTravelTimeMinutes(
        trip.pickupDistanceKm,
        30,
        s.time,
        s.weather,
        s.stats.stamina,
        s.location.routeMode
      );
      const pickupTravelTime = Math.max(1, Math.round(basePickupTime * travelMult));

      trip.stage = 'TO_PICKUP';
      trip.stageMinutesRemaining = pickupTravelTime;
      trip.acceptedAtMinute = s.time.totalMinutes;

      const newAcceptRate = Math.min(1.0, s.app.acceptanceRate + 0.01);

      s.app = {
        ...s.app,
        currentOffer: null,
        activeTrip: trip,
        acceptanceRate: Number(newAcceptRate.toFixed(2)),
      };
      s.currentActivityLabel = `Đón khách/lấy đồ ăn tại ${trip.pickupAddress}`;

      return addLog(s, `Đã nhận cuốc ${trip.title}! Đang di chuyển đến điểm đón (${trip.pickupDistanceKm} km, ~${pickupTravelTime} phút)...`, 'info');
    }

    case 'REJECT_OFFER': {
      if (!s.app.currentOffer) return s;
      const newAcceptRate = Math.max(0.5, s.app.acceptanceRate - 0.02);
      s.app = {
        ...s.app,
        currentOffer: null,
        acceptanceRate: Number(newAcceptRate.toFixed(2)),
        cooldownUntilMinute: s.time.totalMinutes + 2,
      };
      return addLog(s, `Đã bỏ qua cuốc xe. Tỷ lệ nhận cuốc giảm còn ${(newAcceptRate * 100).toFixed(0)}%. Tạm hoãn phát cuốc trong ít phút.`, 'warning');
    }

    case 'CANCEL_ACTIVE_TRIP': {
      if (!s.app.activeTrip) return s;
      const tripTitle = s.app.activeTrip.title;
      const newCancelRate = Math.min(1.0, s.app.cancellationRate + 0.05);
      s.app = {
        ...s.app,
        activeTrip: null,
        cancellationRate: Number(newCancelRate.toFixed(2)),
      };
      s.stats.morale = Math.max(0, s.stats.morale - 5);
      s.currentActivityLabel = null;
      s = addLog(s, `Bạn đã hủy cuốc ${tripTitle}. Tỷ lệ hủy tăng lên ${(newCancelRate * 100).toFixed(0)}%! Tinh thần -5.`, 'warning');

      const status = checkAccountStatus(s.app);
      if (status.warningIssued && status.message) {
        s.app = status.app;
        s = addLog(s, status.message, status.isSuspended ? 'danger' : 'warning');
      }
      return s;
    }

    case 'TICK_OFFER_COUNTDOWN': {
      if (!s.app.currentOffer) return s;
      const offer = { ...s.app.currentOffer };
      offer.countdownSeconds -= 1;
      if (offer.countdownSeconds <= 0) {
        return dispatch(s, { t: 'REJECT_OFFER', id: offer.id });
      }
      s.app = { ...s.app, currentOffer: offer };
      return s;
    }

    case 'CLOSE_SUMMARY_MODAL': {
      s.showDailySummaryModal = false;
      s.pendingSummary = null;
      s.speed = 1;
      return s;
    }

    case 'CHOOSE_EVENT_OPTION':
    case 'CHOOSE_EVENT': {
      if (!s.activeEvent || s.activeEvent.id !== action.eventId) {
        return s;
      }
      const res = applyEventOption(s, s.activeEvent, action.optionIndex);
      s = res.state;
      s.speed = 1;
      return addLog(s, res.logText, 'info');
    }

    case 'DISMISS_ACCIDENT': {
      s.activeAccident = null;
      s.speed = 1;
      return s;
    }

    case 'SET_ROUTE_MODE': {
      s.location = { ...s.location, routeMode: action.mode };
      const modeLabel = action.mode === 'fast' ? 'Nhanh nhất' : action.mode === 'light' ? 'Ít kẹt xe (+15% km)' : 'Tránh ngập (+25% km)';
      return addLog(s, `Đã chọn chế độ dẫn đường: ${modeLabel}.`, 'info');
    }

    case 'MOVE_TO': {
      if (s.app.activeTrip) {
        return addLog(s, 'Đang thực hiện cuốc xe, không thể tự chuyển vùng!', 'warning');
      }
      if (action.targetZoneId === s.location.currentZoneId) {
        return s;
      }
      const targetZone = zonesData.find((z) => z.id === action.targetZoneId);
      if (!targetZone) return s;

      const travelMult = getTravelTimeMultiplier(s.skills, s.drivingStyle);
      const travelMins = Math.max(3, Math.round(15 * travelMult));
      s.location = {
        ...s.location,
        isTraveling: true,
        targetZoneId: action.targetZoneId,
        travelMinutesRemaining: travelMins,
        currentSpotId: action.targetSpotId || null,
        routeMode: action.routeMode || s.location.routeMode,
      };
      s.currentActivityLabel = `Di chuyển sang ${targetZone.name}`;
      return addLog(s, `Bắt đầu di chuyển sang ${targetZone.name} (~${travelMins} phút)...`, 'info');
    }

    case 'CHARGE_PHONE': {
      if (s.economy.cash < 15000) {
        return addLog(s, 'Không đủ 15.000đ mua ly nước để ngồi sạc nhờ pin điện thoại!', 'warning');
      }
      s.economy = {
        ...s.economy,
        cash: s.economy.cash - 15000,
        todayExpenses: {
          ...s.economy.todayExpenses,
          food: s.economy.todayExpenses.food + 15000,
        },
      };
      s.stats = {
        ...s.stats,
        phoneBattery: Math.min(100, s.stats.phoneBattery + 55),
        morale: Math.min(100, s.stats.morale + 3),
      };
      s = step(s, 25);
      return addLog(s, 'Ghé quán cafe uống ly trà đá và cắm sạc pin điện thoại: Pin +55% (Mất 25 phút, -15.000đ).', 'success');
    }

    case 'REPAIR_PART': {
      const res = repairVehiclePart(s.vehicle, action.part, s.economy.cash);
      if (res.error) {
        return addLog(s, res.error, 'warning');
      }
      s.vehicle = res.vehicle;
      s.economy = {
        ...s.economy,
        cash: s.economy.cash - res.cost,
        todayExpenses: {
          ...s.economy.todayExpenses,
          maintenance: s.economy.todayExpenses.maintenance + res.cost,
        },
      };
      s = step(s, 20); // Maintenance takes 20 mins
      return addLog(s, `Đã bảo dưỡng / sửa chữa xong: Chi phí -${res.cost.toLocaleString('vi-VN')}đ. Bộ phận đã hồi phục 100%!`, 'success');
    }

    case 'EAT': {
      const food = itemsData.foods.find((f) => f.id === action.itemId);
      if (!food) return s;

      if (s.economy.cash < food.price) {
        return addLog(s, `Không đủ tiền mặt để mua ${food.name} (Cần ${food.price.toLocaleString('vi-VN')}đ)!`, 'danger');
      }

      s.economy = {
        ...s.economy,
        cash: s.economy.cash - food.price,
        todayExpenses: {
          ...s.economy.todayExpenses,
          food: s.economy.todayExpenses.food + food.price,
        },
      };

      s.stats = applyEatFood(s.stats, food.hungerRestore, food.moraleRestore);
      s = step(s, food.durationMinutes);
      return addLog(s, `Đã ăn ${food.name} (-${food.price.toLocaleString('vi-VN')}đ, mất ${food.durationMinutes} phút): No +${food.hungerRestore}.`, 'success');
    }

    case 'DRINK': {
      const drink = itemsData.drinks.find((d) => d.id === action.itemId);
      if (!drink) return s;

      if (s.economy.cash < drink.price) {
        return addLog(s, `Không đủ tiền mặt để mua ${drink.name}!`, 'danger');
      }

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
      s.speed = 8;
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
      s = step(s, 5);
      return addLog(
        s,
        `Đã đổ ${refuelRes.litersAdded.toFixed(1)} lít xăng hết ${refuelRes.cost.toLocaleString('vi-VN')}đ. Bình xăng hiện tại: ${(s.vehicle.fuelCurrent / s.vehicle.fuelCapacity * 100).toFixed(0)}%.`,
        'success'
      );
    }

    case 'SWAP_BATTERY': {
      const res = swapBattery(s.vehicle, s.economy.cash);
      if (res.error) return addLog(s, res.error, 'warning');
      s.vehicle = res.vehicle;
      s.economy = {
        ...s.economy,
        cash: s.economy.cash - res.cost,
        todayExpenses: {
          ...s.economy.todayExpenses,
          fuel: s.economy.todayExpenses.fuel + res.cost,
        },
      };
      s = step(s, 3);
      return addLog(s, '🔋 Đã đổi pin tại trạm (-15.000đ, mất 3 phút): Pin phục hồi 100%!', 'success');
    }

    case 'CHARGE_VEHICLE': {
      const mins = action.durationMinutes || 60;
      s.vehicle = chargeBattery(s.vehicle, mins);
      s = step(s, mins);
      return addLog(s, `🔌 Cắm sạc xe điện trong ${mins} phút: Pin hiện tại đạt ${Math.round(s.vehicle.fuelCurrent)}%.`, 'success');
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

    // Milestone 5 Actions
    case 'SET_DRIVING_STYLE': {
      s.drivingStyle = action.style;
      const label =
        action.style === 'safe'
          ? 'Lái an toàn (tuân thủ 100% luật)'
          : action.style === 'rush'
          ? 'Gấp rút (vượt đèn vàng/đỏ)'
          : action.style === 'shortcut'
          ? 'Đi đường tắt (ngược chiều/vỉa hè)'
          : 'Bình thường';
      return addLog(s, `Đã chọn phong cách chạy: ${label}.`, 'info');
    }

    case 'DISMISS_POLICE_FINE': {
      s.activePoliceFine = null;
      s.speed = 1;
      return s;
    }

    case 'SET_GOAL': {
      const goalDef = goalsData.availableGoals.find((g) => g.id === action.goalId);
      if (!goalDef) return s;
      s.goal = {
        id: goalDef.id,
        title: goalDef.title,
        targetAmount: goalDef.targetAmount,
        currentAmount: 0,
        achieved: false,
      };
      return addLog(s, `Đã chọn mục tiêu cuộc sống mới: [${goalDef.title}] (Mục tiêu: ${goalDef.targetAmount.toLocaleString('vi-VN')}đ)!`, 'info');
    }

    case 'CONTRIBUTE_GOAL': {
      const amt = action.amount;
      if (s.economy.cash < amt) {
        return addLog(s, `Không đủ tiền mặt để tích lũy ${amt.toLocaleString('vi-VN')}đ!`, 'warning');
      }
      s.economy.cash -= amt;
      const timeFormatted = formatTime24h(s.time.hour, s.time.minute);
      const res = contributeGoal(s.goal, amt, s.logs, s.time.totalMinutes, timeFormatted);
      s.goal = res.updatedGoal;
      if (res.updatedGoal.achieved) {
        s.stats.morale = Math.min(100, s.stats.morale + 25);
      }
      return s;
    }

    case 'TAKE_EMERGENCY_LOAN': {
      const amt = action.amount;
      s.economy.cash += amt;
      s.loan.totalPrincipal += amt;
      return addLog(s, `💵 Đã nhận tiền vay khẩn cấp +${amt.toLocaleString('vi-VN')}đ vào tiền mặt. Dư nợ gốc hiện tại: ${s.loan.totalPrincipal.toLocaleString('vi-VN')}đ.`, 'warning');
    }

    case 'REPAY_LOAN': {
      const amt = Math.min(action.amount, s.loan.totalPrincipal);
      if (s.economy.cash < amt) {
        return addLog(s, `Không đủ tiền mặt để trả nợ ${amt.toLocaleString('vi-VN')}đ!`, 'warning');
      }
      s.economy.cash -= amt;
      s.loan.totalPrincipal -= amt;
      return addLog(s, `Đã thanh toán nợ -${amt.toLocaleString('vi-VN')}đ. Dư nợ còn lại: ${s.loan.totalPrincipal.toLocaleString('vi-VN')}đ.`, 'success');
    }

    case 'BUY_VEHICLE': {
      const vDef = vehiclesData.find((v) => v.id === action.vehicleId);
      if (!vDef) return s;
      const isInstallment = action.paymentMode === 'installment';
      const upfrontCost = isInstallment ? (vDef.downPayment || 5000000) : vDef.price;
      if (s.economy.cash < upfrontCost) {
        return addLog(s, `Không đủ tiền mặt (${upfrontCost.toLocaleString('vi-VN')}đ) để mua ${vDef.name}!`, 'danger');
      }
      s.economy.cash -= upfrontCost;
      if (isInstallment) {
        const remainingDebt = vDef.price - upfrontCost;
        s.loan.totalPrincipal += remainingDebt;
      }
      const newVehicle = createVehicle(vDef.id);
      s.ownedVehicles = [...s.ownedVehicles, newVehicle];
      s.vehicle = newVehicle;
      return addLog(
        s,
        `🎉 Chúc mừng bạn đã sở hữu xe mới: ${vDef.name}! ${isInstallment ? `Trả trước ${upfrontCost.toLocaleString('vi-VN')}đ, ghi nhận nợ góp.` : 'Thanh toán đứt 100% bằng tiền mặt.'}`,
        'success'
      );
    }

    case 'SWITCH_VEHICLE': {
      const found = s.ownedVehicles.find((v) => v.id === action.vehicleId);
      if (!found) return s;
      s.vehicle = found;
      return addLog(s, `Đã đổi sang phương tiện: ${found.name}.`, 'info');
    }

    // Milestone 6 Actions
    case 'SET_DIFFICULTY': {
      s.difficulty = action.difficulty;
      const label = action.difficulty === 'easy' ? 'Dễ thở' : action.difficulty === 'hard' ? 'Khắc nghiệt' : 'Tiêu chuẩn';
      return addLog(s, `Đã chuyển mức độ khó sang: ${label}.`, 'info');
    }

    case 'CHOOSE_TET_DECISION': {
      s.choseTetHome = action.goHome;
      if (action.goHome) {
        s.economy = {
          ...s.economy,
          cash: Math.max(0, s.economy.cash - 800000),
          todayExpenses: {
            ...s.economy.todayExpenses,
            other: s.economy.todayExpenses.other + 800000,
          },
        };
        s.stats = {
          ...s.stats,
          health: 100,
          morale: 100,
          sleepDebt: 0,
        };
        s.app = { ...s.app, isOnline: false, activeTrip: null };
        return addLog(s, '🧧 Bạn đã quyết định về quê ăn Tết cùng mẹ và gia đình! Vé xe Tết -800.000đ. Tinh thần & Sức khỏe hồi phục 100%!', 'event');
      } else {
        s.stats.morale = Math.max(10, s.stats.morale - 10);
        return addLog(s, '🏍️ Bạn chọn ở lại Sài Gòn cày Tết! Giá cước sẽ tăng vọt nhưng nhớ gọi điện chúc Tết mẹ ở quê.', 'event');
      }
    }

    case 'UNLOCK_ACHIEVEMENT': {
      if (!s.unlockedAchievements.includes(action.achievementId)) {
        s.unlockedAchievements = [...s.unlockedAchievements, action.achievementId];
      }
      return s;
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
  currentOffer: TripOrder | null;
  activeTrip: TripOrder | null;
  activeEvent: GameState['activeEvent'];
  activeAccident: GameState['activeAccident'];
  activePoliceFine: GameState['activePoliceFine'];
  showDailySummaryModal: boolean;
  pendingSummary: DailySummary | null;
  stats: {
    stamina: number;
    hunger: number;
    alertness: number;
    morale: number;
    health: number;
    baseFatigue: number;
    phoneBattery: number;
    isSick: boolean;
    isStaminaLow: boolean;
    isHungerLow: boolean;
    isAlertnessLow: boolean;
    isMoraleLow: boolean;
    isHealthLow: boolean;
    isBatteryLow: boolean;
  };
  vehicle: {
    id: string;
    name: string;
    category: GameState['vehicle']['category'];
    fuelType: GameState['vehicle']['fuelType'];
    fuelPercent: number;
    fuelLiters: number;
    odometerKm: number;
    condition: GameState['vehicle']['condition'];
  };
  ownedVehicles: GameState['ownedVehicles'];
  drivingStyle: GameState['drivingStyle'];
  skills: GameState['skills'];
  npcMessages: GameState['npcMessages'];
  activeCsgtZones: string[];
  goal: GameState['goal'];
  loan: GameState['loan'];
  difficulty: GameState['difficulty'];
  unlockedAchievements: string[];
  isTetSeason: boolean;
  choseTetHome: boolean | null;
  historySummaries: DailySummary[];
  weather: {
    type: string;
    label: string;
    temperature: number;
    isRainy: boolean;
    isFlooded: boolean;
  };
  location: {
    zoneName: string;
    spotName: string;
    routeMode: 'fast' | 'light' | 'dry';
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
    activityLabel: state.currentActivityLabel || (state.app.isOnline ? (state.app.activeTrip ? 'Đang thực hiện cuốc' : 'Đang bật app chờ cuốc') : 'Nghỉ ngơi offline'),
    currentOffer: state.app.currentOffer,
    activeTrip: state.app.activeTrip,
    activeEvent: state.activeEvent,
    activeAccident: state.activeAccident,
    activePoliceFine: state.activePoliceFine,
    showDailySummaryModal: state.showDailySummaryModal,
    pendingSummary: state.pendingSummary,
    stats: {
      stamina: Math.round(state.stats.stamina),
      hunger: Math.round(state.stats.hunger),
      alertness: Math.round(state.stats.alertness),
      morale: Math.round(state.stats.morale),
      health: Math.round(state.stats.health),
      baseFatigue: Math.round(state.stats.baseFatigue),
      phoneBattery: Math.round(state.stats.phoneBattery),
      isSick: state.stats.isSick,
      isStaminaLow: state.stats.stamina < 25,
      isHungerLow: state.stats.hunger < 20,
      isAlertnessLow: state.stats.alertness < 30,
      isMoraleLow: state.stats.morale < 30,
      isHealthLow: state.stats.health < 40,
      isBatteryLow: state.stats.phoneBattery < 15,
    },
    vehicle: {
      id: state.vehicle.id,
      name: state.vehicle.name,
      category: state.vehicle.category,
      fuelType: state.vehicle.fuelType,
      fuelPercent: Math.round((state.vehicle.fuelCurrent / state.vehicle.fuelCapacity) * 100),
      fuelLiters: Number(state.vehicle.fuelCurrent.toFixed(1)),
      odometerKm: Math.round(state.vehicle.odometerKm),
      condition: state.vehicle.condition,
    },
    ownedVehicles: state.ownedVehicles,
    drivingStyle: state.drivingStyle,
    skills: state.skills,
    npcMessages: state.npcMessages,
    activeCsgtZones: state.activeCsgtZones,
    goal: state.goal,
    loan: state.loan,
    difficulty: state.difficulty,
    unlockedAchievements: state.unlockedAchievements,
    isTetSeason: state.isTetSeason,
    choseTetHome: state.choseTetHome,
    historySummaries: state.historySummaries,
    weather: {
      type: state.weather.type,
      label: weatherLabel,
      temperature: state.weather.temperature,
      isRainy: state.weather.type === 'light_rain' || state.weather.type === 'heavy_rain' || state.weather.type === 'storm',
      isFlooded: state.weather.isFlooded,
    },
    location: {
      zoneName: currentZone ? currentZone.name : 'TP.HCM',
      spotName: currentSpot ? currentSpot.name : 'Đang di chuyển',
      routeMode: state.location.routeMode,
    },
    logs: state.logs,
  };
}
