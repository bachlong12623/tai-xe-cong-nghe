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
  
  // Hidden / extended stats (Milestone 4)
  sleepDebt: number;    // hours
  baseFatigue: number;  // 0 - 100 (accumulated fatigue)
  health: number;       // 0 - 100
  phoneBattery: number; // 0 - 100
  isSick: boolean;
  sickDaysRemaining: number;
  
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
  sparkPlug: number;
}

export interface VehicleState {
  id: string;
  name: string;
  category: 'motorcycle' | 'motorcycle_electric' | 'car';
  fuelType: 'gas' | 'electric';
  fuelCurrent: number;     // liters or battery percent (0 - 100)
  fuelCapacity: number;    // liters or 100
  odometerKm: number;
  condition: VehicleCondition;
  canDeliverFood: boolean;
  canRidePassenger: boolean;
}

export interface DailyExpenses {
  food: number;
  fuel: number;
  maintenance: number;
  fines: number;
  rent: number;
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
  rentCost: number;
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

export interface GameEventOptionEffects {
  staminaDelta?: number;
  moraleDelta?: number;
  healthDelta?: number;
  batteryRestore?: number;
  ratingPenalty?: number;
  ratingBonus?: number;
  tireRepair?: number;
  sparkPlugRepair?: number;
  forceOffline?: boolean;
}

export interface GameEventOption {
  label: string;
  cost: number;
  durationMinutes: number;
  effects: GameEventOptionEffects;
}

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  weight?: number;
  options: GameEventOption[];
  cooldownMinutes?: number;
  conditions?: {
    requiresFlood?: boolean;
    requiresRain?: boolean;
    requiresNight?: boolean;
    minKmDriven?: number;
  };
}

export interface AccidentEvent {
  severity: 'light' | 'moderate' | 'severe';
  title: string;
  description: string;
  repairCost: number;
  medicalCost: number;
  daysOff: number;
  healthPenalty: number;
  moralePenalty: number;
}

// Milestone 5 additions
export type DrivingStyle = 'safe' | 'normal' | 'rush' | 'shortcut';

export interface PoliceFineEvent {
  reason: string;
  fineAmount: number;
  zoneName: string;
}

export interface SkillState {
  level: number;
  exp: number;
}

export interface DriverSkills {
  streetKnowledge: SkillState;   // Thuộc đường
  communication: SkillState;     // Giao tiếp
  itemHandling: SkillState;      // Giữ đồ
  defensiveDriving: SkillState;  // Lái an toàn
  stressResilience: SkillState;  // Tự chủ
}

export interface NpcMessage {
  id: string;
  npcId: string;
  npcName: string;
  avatar: string;
  zoneId?: string;
  content: string;
  timestampFormatted: string;
  reliability: number;
  type: 'traffic' | 'police' | 'flood' | 'demand' | 'merchant' | 'chatter';
}

export interface CharacterGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  achieved: boolean;
}

export interface LoanState {
  totalPrincipal: number;
  dailyInterestRate: number;
  daysOverdue: number;
}

export interface GameState {
  schemaVersion: number;
  seed: number;
  rng: RngState;
  speed: 0 | 1 | 2 | 4 | 8;
  time: GameTime;
  stats: CharacterStats;
  vehicle: VehicleState;
  ownedVehicles: VehicleState[];
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
  activeEvent: GameEvent | null;
  activeAccident: AccidentEvent | null;
  showDailySummaryModal: boolean;
  pendingSummary: DailySummary | null;
  recentEventCooldowns: Record<string, number>; // eventId -> availableAtMinute

  // Milestone 5 additions
  drivingStyle: DrivingStyle;
  skills: DriverSkills;
  npcMessages: NpcMessage[];
  activeCsgtZones: string[];
  activePoliceFine: PoliceFineEvent | null;
  goal: CharacterGoal;
  loan: LoanState;

  // Milestone 6 additions
  difficulty: 'easy' | 'normal' | 'hard';
  unlockedAchievements: string[];
  isTetSeason: boolean;
  choseTetHome: boolean | null;
  historySummaries: DailySummary[];
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
  | { t: 'SET_ROUTE_MODE'; mode: 'fast' | 'light' | 'dry' }
  | { t: 'ACCEPT_OFFER'; id: string }
  | { t: 'REJECT_OFFER'; id: string }
  | { t: 'CANCEL_ACTIVE_TRIP' }
  | { t: 'TICK_OFFER_COUNTDOWN' }
  | { t: 'CLOSE_SUMMARY_MODAL' }
  | { t: 'CHOOSE_EVENT_OPTION'; eventId: string; optionIndex: number }
  | { t: 'DISMISS_ACCIDENT' }
  | { t: 'REPAIR_PART'; part: 'tires' | 'oil' | 'brakes' | 'chain' | 'sparkPlug' }
  | { t: 'CHARGE_PHONE' }
  | { t: 'CHOOSE_EVENT'; eventId: string; optionIndex: number }
  // Milestone 5 Actions
  | { t: 'SET_DRIVING_STYLE'; style: DrivingStyle }
  | { t: 'DISMISS_POLICE_FINE' }
  | { t: 'SET_GOAL'; goalId: string }
  | { t: 'CONTRIBUTE_GOAL'; amount: number }
  | { t: 'TAKE_EMERGENCY_LOAN'; amount: number }
  | { t: 'REPAY_LOAN'; amount: number }
  | { t: 'BUY_VEHICLE'; vehicleId: string; paymentMode: 'cash' | 'installment' }
  | { t: 'SWITCH_VEHICLE'; vehicleId: string }
  | { t: 'SWAP_BATTERY' }
  | { t: 'CHARGE_VEHICLE'; durationMinutes?: number }
  // Milestone 6 Actions
  | { t: 'SET_DIFFICULTY'; difficulty: 'easy' | 'normal' | 'hard' }
  | { t: 'CHOOSE_TET_DECISION'; goHome: boolean }
  | { t: 'UNLOCK_ACHIEVEMENT'; achievementId: string };
