import { GameState, DailySummary } from './types';
import { createGame, step, dispatch } from './engine';

export type BotStrategy = 'balanced' | 'workaholic' | 'lazy' | 'peak_hunter';

export interface BotDayReport {
  day: number;
  strategy: BotStrategy;
  grossRevenue: number;
  netProfit: number;
  hoursOnline: number;
  hoursSlept: number;
  sleepDebt: number;
  tripsCount: number;
  staminaEnd: number;
  hungerEnd: number;
  alertnessEnd: number;
  moraleEnd: number;
  fuelLitersLeft: number;
  cashEnd: number;
  collapsed: boolean;
}

export interface BotSimulationResult {
  strategy: BotStrategy;
  totalDays: number;
  daysSurvived: number;
  collapsed: boolean;
  collapseReason?: string;
  totalNetProfit: number;
  totalTrips: number;
  dailyReports: BotDayReport[];
  summaries: DailySummary[];
}

/**
 * Executes 1 minute bot heuristic decision.
 */
function botDecideMinute(state: GameState, strategy: BotStrategy): GameState {
  let s = state;

  // 1. Dismiss any open summary modal to resume
  if (s.showDailySummaryModal) {
    s = dispatch(s, { t: 'CLOSE_SUMMARY_MODAL' });
  }

  // Handle active accident
  if (s.activeAccident) {
    s = dispatch(s, { t: 'DISMISS_ACCIDENT' });
    return s;
  }

  // Handle active police fine
  if (s.activePoliceFine) {
    s = dispatch(s, { t: 'DISMISS_POLICE_FINE' });
    return s;
  }

  // Handle active random street event
  if (s.activeEvent) {
    // Pick the most economical/safe option (usually option 0)
    s = dispatch(s, { t: 'CHOOSE_EVENT_OPTION', eventId: s.activeEvent.id, optionIndex: 0 });
    return s;
  }

  // Handle Tet Lunar New Year decision if prompted
  if (s.isTetSeason && s.choseTetHome === null && s.time.day >= 27) {
    // Balanced bot goes home if financially prosperous (> 2.5m cash); others stay
    const goHome = strategy === 'balanced' && s.economy.cash >= 2500000;
    s = dispatch(s, { t: 'CHOOSE_TET_DECISION', goHome });
    return s;
  }

  // Recharge phone if battery is low (< 20%) and not on trip/sleeping
  if (!s.isSleeping && !s.app.activeTrip && s.stats.phoneBattery < 25 && s.economy.cash >= 15000) {
    s = dispatch(s, { t: 'CHARGE_PHONE' });
    return s;
  }

  // Refuel if gas is low (< 1.2L) and not sleeping/on trip
  if (!s.isSleeping && !s.app.activeTrip && s.vehicle.fuelCurrent < 1.2 && s.economy.cash >= 25000) {
    s = dispatch(s, { t: 'REFUEL' });
    return s;
  }

  // Vehicle maintenance for long-term survival
  if (!s.isSleeping && !s.app.activeTrip) {
    if (s.vehicle.condition.oil < 15 && s.economy.cash >= 150000) {
      s = dispatch(s, { t: 'REPAIR_PART', part: 'oil' });
      return s;
    }
    if (s.vehicle.condition.brakes < 15 && s.economy.cash >= 150000) {
      s = dispatch(s, { t: 'REPAIR_PART', part: 'brakes' });
      return s;
    }
    if (s.vehicle.condition.tires < 15 && s.economy.cash >= 300000) {
      s = dispatch(s, { t: 'REPAIR_PART', part: 'tires' });
      return s;
    }
  }

  // 3. Handle incoming trip offer
  if (s.app.currentOffer) {
    const offer = s.app.currentOffer;
    if (strategy === 'lazy') {
      // Lazy bot rejects trips > 3.5km
      if (offer.tripDistanceKm > 3.5) {
        s = dispatch(s, { t: 'REJECT_OFFER', id: offer.id });
      } else {
        s = dispatch(s, { t: 'ACCEPT_OFFER', id: offer.id });
      }
    } else {
      s = dispatch(s, { t: 'ACCEPT_OFFER', id: offer.id });
    }
    return s;
  }

  // If currently sleeping or on a trip, let simulation progress
  if (s.isSleeping || s.app.activeTrip) {
    return s;
  }

  const hour = s.time.hour;

  // 4. STRATEGY SPECIFIC LOGIC
  switch (strategy) {
    case 'balanced': {
      // Prepare for bedtime: stop accepting new trips after 22:30
      if ((hour === 22 && s.time.minute >= 30) || (hour >= 23 || hour < 6)) {
        if (s.app.isOnline) {
          s = dispatch(s, { t: 'GO_OFFLINE' });
        }
      }

      // Bedtime: anywhere between 23:00 and 06:00
      if ((hour >= 23 || hour < 6) && !s.isSleeping) {
        const hoursNeeded = hour >= 23 ? (6 + (24 - hour)) : (6 - hour);
        if (hoursNeeded >= 1) {
          s = dispatch(s, { t: 'SLEEP', hours: Math.max(2, Math.min(8, hoursNeeded)) });
          return s;
        }
      }

      // Eating routine: hunger < 45
      if (s.stats.hunger < 45 && s.economy.cash >= 35000) {
        s = dispatch(s, { t: 'EAT', itemId: 'com_binh_dan' });
        return s;
      }

      // Midday fatigue: alertness < 40 during daytime -> coffee or nap
      if (s.stats.alertness < 40 && hour >= 6 && hour < 22) {
        if (s.economy.cash >= 15000 && s.stats.coffeeCountToday < 2) {
          s = dispatch(s, { t: 'DRINK', itemId: 'ca_phe_den' });
          return s;
        } else if (s.stats.lastNapMinute === null || s.time.totalMinutes - s.stats.lastNapMinute >= 240) {
          s = dispatch(s, { t: 'NAP' });
          return s;
        }
      }

      // Online hours: 06:00 to 22:30
      if (!s.app.isOnline && hour >= 6 && (hour < 22 || (hour === 22 && s.time.minute < 30))) {
        s = dispatch(s, { t: 'GO_ONLINE' });
      }
      break;
    }

    case 'workaholic': {
      // Runs hard ~18-19h/day, sleeps 4 hours from 01:00 to 05:00
      if (hour >= 1 && hour < 5 && !s.isSleeping) {
        s = dispatch(s, { t: 'SLEEP', hours: 4 });
        return s;
      }

      // Midday quick nap on park bench when exhausted to keep going
      if (hour >= 12 && hour <= 14 && (s.stats.stamina < 20 || s.stats.alertness < 25)) {
        if (s.stats.lastNapMinute === null || s.time.totalMinutes - s.stats.lastNapMinute >= 240) {
          s = dispatch(s, { t: 'NAP' });
          return s;
        }
      }

      // Eats cheapest food only when starving
      if (s.stats.hunger < 35 && s.economy.cash >= 20000) {
        s = dispatch(s, { t: 'EAT', itemId: 'banh_mi' });
        return s;
      }

      // Chugs coffee continuously whenever alertness < 50
      if (s.stats.alertness < 50 && s.economy.cash >= 15000) {
        s = dispatch(s, { t: 'DRINK', itemId: 'ca_phe_den' });
        return s;
      }

      // Online from 05:00 to 01:00
      if (!s.app.isOnline && !s.isSleeping && (hour >= 5 || hour < 1)) {
        s = dispatch(s, { t: 'GO_ONLINE' });
      }
      break;
    }

    case 'lazy': {
      // Offline early after 15:30
      if (hour >= 16 || hour < 10) {
        if (s.app.isOnline) {
          s = dispatch(s, { t: 'GO_OFFLINE' });
        }
      }

      // Long sleep from 21:00 to 07:00 (10 hours)
      if ((hour >= 21 || hour < 7) && !s.isSleeping) {
        const hoursNeeded = hour >= 21 ? (7 + (24 - hour)) : (7 - hour);
        if (hoursNeeded >= 1) {
          s = dispatch(s, { t: 'SLEEP', hours: Math.max(3, Math.min(10, hoursNeeded)) });
          return s;
        }
      }

      // Eats lavishly when hungry
      if (s.stats.hunger < 50 && s.economy.cash >= 80000) {
        s = dispatch(s, { t: 'EAT', itemId: 'quan_xin' });
        return s;
      } else if (s.stats.hunger < 50 && s.economy.cash >= 35000) {
        s = dispatch(s, { t: 'EAT', itemId: 'com_binh_dan' });
        return s;
      }

      // Only works between 10:30 and 15:30 (5 hours/day)
      if (hour >= 11 && hour < 15) {
        if (!s.app.isOnline) {
          s = dispatch(s, { t: 'GO_ONLINE' });
        }
      }
      break;
    }

    case 'peak_hunter': {
      // Sleep from 23:00 to 06:30
      if ((hour >= 23 || hour < 6) && !s.isSleeping) {
        const hoursNeeded = hour >= 23 ? (6.5 + (24 - hour)) : (6.5 - hour);
        if (hoursNeeded >= 1) {
          s = dispatch(s, { t: 'SLEEP', hours: Math.max(2, Math.min(7.5, hoursNeeded)) });
          return s;
        }
      }

      if (s.stats.hunger < 40 && s.economy.cash >= 35000) {
        s = dispatch(s, { t: 'EAT', itemId: 'com_binh_dan' });
        return s;
      }

      // Online ONLY in 2 peaks: Morning (07:00 - 09:00) and Evening (17:00 - 19:30)
      const isMorningPeak = hour >= 7 && hour < 9;
      const isEveningPeak = hour >= 17 && (hour < 19 || (hour === 19 && s.time.minute <= 30));

      if (isMorningPeak || isEveningPeak) {
        if (!s.app.isOnline) {
          s = dispatch(s, { t: 'GO_ONLINE' });
        }
      } else {
        if (s.app.isOnline) {
          s = dispatch(s, { t: 'GO_OFFLINE' });
        }
      }
      break;
    }
  }

  return s;
}

/**
 * Runs a multi-day headless bot simulation.
 */
export function runBotSimulation(
  strategy: BotStrategy,
  daysToRun = 7,
  seed = 42
): BotSimulationResult {
  let state = createGame(seed);
  const dailyReports: BotDayReport[] = [];
  const summaries: DailySummary[] = [];

  let collapsed = false;
  let collapseReason: string | undefined;
  let lastRecordedDay = 1;

  const totalMinutes = daysToRun * 1440;

  for (let m = 0; m < totalMinutes; m++) {
    state = botDecideMinute(state, strategy);
    state = step(state, 1);

    // Check collapse conditions (health/stamina depletion, severe crash, excessive sleep debt)
    if (state.activeAccident && state.activeAccident.severity === 'severe') {
      collapsed = true;
      collapseReason = 'Tai nạn giao thông nghiêm trọng do ngủ gật khi lái xe!';
      break;
    }
    if (state.stats.sleepDebt >= 18) {
      collapsed = true;
      collapseReason = 'Kiệt sức hoàn toàn do nợ ngủ vượt quá 18 giờ tích lũy!';
      break;
    }
    if (state.stats.stamina <= 0 && state.stats.alertness <= 0) {
      collapsed = true;
      collapseReason = 'Sụp đổ thể lực và bất tỉnh vì cày cuốc quá sức!';
      break;
    }
    if (state.stats.health <= 0) {
      collapsed = true;
      collapseReason = 'Sức khỏe kiệt quệ hoàn toàn do kiệt sức và nhịn đói!';
      break;
    }

    // Record daily summary on 05:00 day cycle transition
    if (state.showDailySummaryModal && state.pendingSummary) {
      const summary = state.pendingSummary;
      summaries.push(summary);

      dailyReports.push({
        day: summary.day,
        strategy,
        grossRevenue: summary.grossRevenue,
        netProfit: summary.netProfit,
        hoursOnline: summary.hoursOnline,
        hoursSlept: summary.hoursSlept,
        sleepDebt: state.stats.sleepDebt,
        tripsCount: summary.tripsCount,
        staminaEnd: Math.round(state.stats.stamina),
        hungerEnd: Math.round(state.stats.hunger),
        alertnessEnd: Math.round(state.stats.alertness),
        moraleEnd: Math.round(state.stats.morale),
        fuelLitersLeft: Number(state.vehicle.fuelCurrent.toFixed(1)),
        cashEnd: state.economy.cash,
        collapsed: false,
      });

      lastRecordedDay = summary.day + 1;
      state = dispatch(state, { t: 'CLOSE_SUMMARY_MODAL' });
    }
  }

  // Record final day if not yet pushed
  if (!collapsed && dailyReports.length < daysToRun) {
    const summary = state.economy.lastDaySummary;
    dailyReports.push({
      day: lastRecordedDay,
      strategy,
      grossRevenue: summary?.grossRevenue || 0,
      netProfit: summary?.netProfit || 0,
      hoursOnline: summary?.hoursOnline || 0,
      hoursSlept: summary?.hoursSlept || 0,
      sleepDebt: state.stats.sleepDebt,
      tripsCount: summary?.tripsCount || 0,
      staminaEnd: Math.round(state.stats.stamina),
      hungerEnd: Math.round(state.stats.hunger),
      alertnessEnd: Math.round(state.stats.alertness),
      moraleEnd: Math.round(state.stats.morale),
      fuelLitersLeft: Number(state.vehicle.fuelCurrent.toFixed(1)),
      cashEnd: state.economy.cash,
      collapsed: false,
    });
  }

  const daysSurvived = dailyReports.length;
  const totalNetProfit = dailyReports.reduce((sum, r) => sum + r.netProfit, 0);
  const totalTrips = dailyReports.reduce((sum, r) => sum + r.tripsCount, 0);

  return {
    strategy,
    totalDays: daysToRun,
    daysSurvived,
    collapsed,
    collapseReason,
    totalNetProfit,
    totalTrips,
    dailyReports,
    summaries,
  };
}

/**
 * Format simulation results as CSV string as required by spec Section 19.
 */
export function exportBotResultsCsv(reports: BotDayReport[]): string {
  const headers = [
    'day',
    'strategy',
    'grossRevenue',
    'netProfit',
    'hoursOnline',
    'hoursSlept',
    'sleepDebt',
    'tripsCount',
    'staminaEnd',
    'hungerEnd',
    'alertnessEnd',
    'moraleEnd',
    'cashEnd',
  ].join(',');

  const rows = reports.map((r) =>
    [
      r.day,
      r.strategy,
      r.grossRevenue,
      r.netProfit,
      r.hoursOnline.toFixed(1),
      r.hoursSlept.toFixed(1),
      r.sleepDebt.toFixed(1),
      r.tripsCount,
      r.staminaEnd,
      r.hungerEnd,
      r.alertnessEnd,
      r.moraleEnd,
      r.cashEnd,
    ].join(',')
  );

  return [headers, ...rows].join('\n');
}
