import { RngState } from './rng';
import type { TripOrder } from './orders';

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = Thứ 2, 7 = Chủ Nhật

export interface GameTime {
  day: number;
  dayOfWeek: DayOfWeek;
  hour: number;
  minute: number;
  totalMinutes: number;
}

export interface CoffeeCrashTimer {
  triggerAtMinute: number;
  penalty: number;
}

export interface CharacterStats {
  stamina: number;      // 0 - 100
  hunger: number;       // 0 - 100
  alertness: number;    // 0 - 100
  morale: number;       // 0 - 100
  
  // Hidden / extended stats (from milestone 4, tracked safely)
  sleepDebt: number;    // hours
  baseFatigue: number;  // 0 - 100
  health: number;       // 0 - 100
  phoneBattery: number; // 0 - 100
  
  // Transient tracking
  coffeeCountToday: number;
  coffeeCrashes: CoffeeCrashTimer[];
  lastNapMinute: number | null;
  dailyHoursSlept: number;
}

export interface VehicleCondition {
  tires: number;
  oil: number;
  brakes: number;
  chain: number;
}

export interface VehicleState {
  id: string;
  name: string;
  fuelType: 'gas' | 'electric';
  fuelCurrent: number;     // liters or kWh
  fuelCapacity: number;
  odometerKm: number;
  condition: VehicleCondition;
}

export interface DailyExpenses {
  food: number;
  fuel: number;
  maintenance: number;
  fines: number;
  other: number;
}

export interface DailySummary {
  day: number;
  grossRevenue: number;
  platformCommission: number;
  fuelCost: number;
  foodCost: number;
  finesAndRepairs: number;
  vehicleWearEstimate: number;
  netProfit: number;
  hourlyNetProfit: number;
  tripsCount: number;
  kmDriven: number;
  kmEmpty: number;
  hoursOnline: number;
  hoursSlept: number;
}

export interface EconomyState {
  cash: number;
  appWallet: number;
  savings: number;
  debt: number;
  todayRevenue: number;
  todayTips: number;
  todayBonuses: number;
  todayCompensation: number;
  todayExpenses: DailyExpenses;
  todayTrips: number;
  todayKmPassenger: number;
  todayKmEmpty: number;
  minutesOnlineToday: number;
  lastDaySummary: DailySummary | null;
}

export type DriverTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface DriverApp {
  isOnline: boolean;
  rating: number; // 1.0 - 5.0
  ratingHistory: number[]; // 50 recent ratings
  totalTripsCompleted: number;
  acceptanceRate: number; // 0.0 - 1.0
  cancellationRate: number; // 0.0 - 1.0
  tier: DriverTier;
  warningCount: number;
  suspendedUntilMinute: number | null;
  cooldownUntilMinute: number | null;
  currentOffer: TripOrder | null;
  activeTrip: TripOrder | null;
}

export type WeatherType = 'sunny' | 'cloudy' | 'light_rain' | 'heavy_rain' | 'storm';

export interface WeatherState {
  type: WeatherType;
  temperature: number;
  isFlooded: boolean;
}

export interface LocationState {
  currentZoneId: string;
  currentSpotId: string | null;
  isTraveling: boolean;
  targetZoneId: string | null;
  travelMinutesRemaining: number;
  routeMode: 'fast' | 'light' | 'dry';
}

export interface LogMessage {
  id: string;
  minute: number;
  timeFormatted: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'danger' | 'event';
}

export interface GameState {
  schemaVersion: number;
  seed: number;
  rng: RngState;
  speed: 0 | 1 | 2 | 4 | 8;
  time: GameTime;
  stats: CharacterStats;
  vehicle: VehicleState;
  economy: EconomyState;
  app: DriverApp;
  location: LocationState;
  weather: WeatherState;
  logs: LogMessage[];
  
  // Activity states
  isSleeping: boolean;
  sleepTargetMinutes: number;
  isNapping: boolean;
  napRemainingMinutes: number;
  currentActivityLabel: string | null;
  activeEvent: any | null;
  showDailySummaryModal: boolean;
  pendingSummary: DailySummary | null;
}

export type Action =
  | { t: 'SET_SPEED'; speed: 0 | 1 | 2 | 4 | 8 }
  | { t: 'GO_ONLINE' }
  | { t: 'GO_OFFLINE' }
  | { t: 'EAT'; itemId: string }
  | { t: 'DRINK'; itemId: string }
  | { t: 'SLEEP'; hours: number }
  | { t: 'NAP' }
  | { t: 'WAKE_UP' }
  | { t: 'REFUEL'; liters?: number }
  | { t: 'MOVE_TO'; targetZoneId: string; targetSpotId?: string; routeMode?: 'fast' | 'light' | 'dry' }
  | { t: 'SET_SPOT'; spotId: string | null }
  | { t: 'ACCEPT_OFFER'; id: string }
  | { t: 'REJECT_OFFER'; id: string }
  | { t: 'CANCEL_ACTIVE_TRIP' }
  | { t: 'TICK_OFFER_COUNTDOWN' }
  | { t: 'CLOSE_SUMMARY_MODAL' }
  | { t: 'CHOOSE_EVENT'; eventId: string; optionIndex: number };

