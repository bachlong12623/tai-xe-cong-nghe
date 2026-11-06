import { GameState, GameEvent, GameEventOption } from './types';
import { RngState, nextFloat, choose } from './rng';
import eventsData from '../../data/events.json';

/**
 * Checks whether an event qualifies under current game state conditions.
 */
export function isEventEligible(event: GameEvent, state: GameState): boolean {
  // Cooldown check
  const cooldownUntil = state.recentEventCooldowns[event.id];
  if (cooldownUntil && state.time.totalMinutes < cooldownUntil) {
    return false;
  }

  const cond = event.conditions;
  if (!cond) return true;

  if (cond.requiresFlood && !state.weather.isFlooded) {
    return false;
  }

  const isRain = state.weather.type === 'light_rain' || state.weather.type === 'heavy_rain' || state.weather.type === 'storm';
  if (cond.requiresRain && !isRain) {
    return false;
  }

  const isNight = state.time.hour >= 22 || state.time.hour < 5;
  if (cond.requiresNight && !isNight) {
    return false;
  }

  if (cond.minKmDriven && state.vehicle.odometerKm < cond.minKmDriven) {
    return false;
  }

  return true;
}

/**
 * Evaluates random event arrival per minute.
 * Base probability: roughly ~0.005 per minute (1 event every ~3 hours game time).
 */
export function evaluateRandomEventTrigger(
  state: GameState,
  rng: RngState
): GameEvent | null {
  if (state.isSleeping || state.activeEvent || state.activeAccident || state.showDailySummaryModal) {
    return null;
  }

  // Event trigger chance per minute
  const roll = nextFloat(rng);
  if (roll > 0.006) {
    return null;
  }

  // Filter eligible events
  const eligible = (eventsData as GameEvent[]).filter((e) => isEventEligible(e, state));
  if (eligible.length === 0) return null;

  return choose(rng, eligible);
}

/**
 * Apply the selected event option to the game state.
 */
export function applyEventOption(
  state: GameState,
  event: GameEvent,
  optionIndex: number
): { state: GameState; logText: string } {
  let s = { ...state };
  const option: GameEventOption = event.options[optionIndex] || event.options[0];

  // 1. Financial impact
  if (option.cost > 0) {
    s.economy = {
      ...s.economy,
      cash: Math.max(0, s.economy.cash - option.cost),
      todayExpenses: {
        ...s.economy.todayExpenses,
        other: s.economy.todayExpenses.other + option.cost,
      },
    };
  } else if (option.cost < 0) {
    // Reward / tip / compensation
    const reward = Math.abs(option.cost);
    s.economy = {
      ...s.economy,
      cash: s.economy.cash + reward,
      todayTips: s.economy.todayTips + reward,
    };
  }

  // 2. Stat impacts
  const eff = option.effects;
  if (eff.staminaDelta) {
    s.stats = { ...s.stats, stamina: Math.max(0, Math.min(100, s.stats.stamina + eff.staminaDelta)) };
  }
  if (eff.moraleDelta) {
    s.stats = { ...s.stats, morale: Math.max(0, Math.min(100, s.stats.morale + eff.moraleDelta)) };
  }
  if (eff.healthDelta) {
    s.stats = { ...s.stats, health: Math.max(0, Math.min(100, s.stats.health + eff.healthDelta)) };
  }
  if (eff.batteryRestore) {
    s.stats = { ...s.stats, phoneBattery: Math.min(100, s.stats.phoneBattery + eff.batteryRestore) };
  }
  if (eff.ratingPenalty) {
    s.app = { ...s.app, rating: Math.max(1.0, Number((s.app.rating - eff.ratingPenalty).toFixed(2))) };
  }
  if (eff.ratingBonus) {
    s.app = { ...s.app, rating: Math.min(5.0, Number((s.app.rating + eff.ratingBonus).toFixed(2))) };
  }
  if (eff.tireRepair) {
    s.vehicle = { ...s.vehicle, condition: { ...s.vehicle.condition, tires: Math.min(100, s.vehicle.condition.tires + eff.tireRepair) } };
  }
  if (eff.sparkPlugRepair) {
    s.vehicle = { ...s.vehicle, condition: { ...s.vehicle.condition, sparkPlug: Math.min(100, s.vehicle.condition.sparkPlug + eff.sparkPlugRepair) } };
  }
  if (eff.forceOffline) {
    s.app = { ...s.app, isOnline: false };
  }

  // 3. Set cooldown
  const cooldownMin = event.cooldownMinutes || 480;
  s.recentEventCooldowns = {
    ...s.recentEventCooldowns,
    [event.id]: s.time.totalMinutes + cooldownMin,
  };

  s.activeEvent = null;
  const logText = `[Sự kiện: ${event.name}] - Lựa chọn: "${option.label}".`;

  return { state: s, logText };
}
