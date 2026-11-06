import achievementsData from '../../data/achievements.json';
import { GameState, LogMessage } from './types';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
}

export function getAllAchievements(): Achievement[] {
  return achievementsData;
}

export function evaluateAchievements(state: GameState): {
  unlockedNewIds: string[];
  logsToAdd: LogMessage[];
} {
  const currentUnlocked = state.unlockedAchievements || [];
  const newlyUnlocked: string[] = [];
  const logsToAdd: LogMessage[] = [];

  for (const ach of achievementsData) {
    if (currentUnlocked.includes(ach.id)) continue;

    let unlocked = false;

    switch (ach.id) {
      case 'first_trip':
        unlocked = state.app.totalTripsCompleted >= 1;
        break;
      case 'ten_trips_day':
        unlocked = state.economy.todayTrips >= 10;
        break;
      case 'rain_rider':
        unlocked =
          state.app.totalTripsCompleted >= 1 &&
          (state.weather.type === 'heavy_rain' || state.weather.type === 'storm');
        break;
      case 'night_owl':
        unlocked =
          state.app.totalTripsCompleted >= 1 &&
          (state.time.hour >= 0 && state.time.hour <= 4);
        break;
      case 'big_tip':
        unlocked = state.economy.todayTips >= 30000;
        break;
      case 'five_star_driver':
        unlocked =
          state.app.totalTripsCompleted >= 20 &&
          state.app.rating >= 4.95;
        break;
      case 'own_bike':
        unlocked = state.loan.totalPrincipal <= 0;
        break;
      case 'green_revolution':
        unlocked = state.vehicle.fuelType === 'electric';
        break;
      case 'four_wheels':
        unlocked = state.vehicle.category === 'car';
        break;
      case 'millionaire':
        unlocked = state.economy.cash >= 10000000;
        break;
      case 'healthy_sleep':
        unlocked = state.stats.sleepDebt === 0 && state.time.day >= 3;
        break;
      case 'survive_7_days':
        unlocked = state.time.day >= 7;
        break;
    }

    if (unlocked) {
      newlyUnlocked.push(ach.id);
      logsToAdd.push({
        id: `ach-${ach.id}-${state.time.totalMinutes}`,
        minute: state.time.totalMinutes,
        timeFormatted: `${String(state.time.hour).padStart(2, '0')}:${String(state.time.minute).padStart(2, '0')}`,
        text: `🎖️ MỞ KHÓA THÀNH TỰU: [${ach.title}] ${ach.icon} — ${ach.description}`,
        type: 'event',
      });
    }
  }

  return { unlockedNewIds: newlyUnlocked, logsToAdd };
}
