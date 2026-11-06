import { RngState, nextFloat, nextInt, choose, nextGaussian } from './rng';
import { GameTime, WeatherState, DriverApp } from './types';
import { getDemandForHour } from './demand';
import { getCommissionRate, getDispatchPriority } from './platform';
import zonesData from '../../data/zones.json';
import pricingData from '../../data/pricing.json';

export type OrderType = 'food' | 'ride';
export type PaymentMethod = 'cash' | 'digital';

export type CustomerProfileType =
  | 'normal'
  | 'rushed'
  | 'heavy_luggage'
  | 'group'
  | 'foreigner'
  | 'picky'
  | 'drunk';

export interface CustomerProfile {
  type: CustomerProfileType;
  label: string;
  tipChance: number;
  tipMin: number;
  tipMax: number;
  complaintRisk: number;
}

export type TripStage =
  | 'OFFERED'
  | 'TO_PICKUP'
  | 'AT_MERCHANT_WAITING'
  | 'PICKED_UP'
  | 'TO_DROPOFF'
  | 'COMPLETED'
  | 'CANCELLED';

export interface TripOrder {
  id: string;
  type: OrderType;
  title: string;
  customerName: string;
  customerProfile: CustomerProfile;
  pickupZoneId: string;
  dropoffZoneId: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupDistanceKm: number;
  tripDistanceKm: number;
  grossFare: number;
  netFare: number;
  platformCommission: number;
  surgeMultiplier: number;
  paymentMethod: PaymentMethod;
  isPeakHour: boolean;
  rainBonus: number;
  
  // Specific to food
  foodItems?: string;
  merchantPrepMinutes?: number;
  merchantWaitRemaining?: number;
  isFragile?: boolean; // trà sữa, súp

  // Progress state
  stage: TripStage;
  stageMinutesRemaining: number;
  countdownSeconds: number; // 12s countdown
  acceptedAtMinute?: number;
  tipReceived?: number;
  driverRatingAwarded?: number;
}

const VIETNAMESE_NAMES = [
  'Nguyễn Minh Anh', 'Trần Hoàng Long', 'Lê Thị Thu Thảo', 'Phạm Quốc Bảo',
  'Vũ Đức Thịnh', 'Hoàng Mỹ Linh', 'Đặng Tuấn Kiệt', 'Bùi Ngọc Hân',
  'Ngô Thanh Vân', 'Dương Khắc Huy', 'Lý Gia Hào', 'Phan Kim Ngân'
];

const FOOD_ITEMS = [
  { name: 'Trà sữa Oolong nướng 3 ly', fragile: true },
  { name: 'Cơm tấm sườn bì chả đặc biệt', fragile: false },
  { name: 'Phở bò tái nạm bắp hoa', fragile: true },
  { name: 'Bánh mì thịt nướng & Chè bưởi', fragile: false },
  { name: 'Gà rán giòn cay & Khoai tây lắc', fragile: false },
  { name: 'Bún bò Huế giò heo', fragile: true },
  { name: 'Pizza thập cẩm cỡ lớn & Coca', fragile: false },
  { name: 'Bánh tráng nướng & Cút lộn xào me', fragile: false }
];

export function getRandomCustomerProfile(
  rng: RngState,
  isBarZone: boolean,
  isLateNight: boolean
): CustomerProfile {
  const roll = nextFloat(rng);

  if (isBarZone && isLateNight && roll < 0.25) {
    return {
      type: 'drunk',
      label: 'Khách say xỉn (Khu Bar đêm)',
      tipChance: 0.35,
      tipMin: 20000,
      tipMax: 70000,
      complaintRisk: 0.25,
    };
  }

  if (roll < 0.55) {
    return {
      type: 'normal',
      label: 'Khách lịch sự bình thường',
      tipChance: 0.12,
      tipMin: 10000,
      tipMax: 20000,
      complaintRisk: 0.04,
    };
  } else if (roll < 0.70) {
    return {
      type: 'rushed',
      label: 'Khách đang rất vội vã',
      tipChance: 0.25,
      tipMin: 15000,
      tipMax: 30000,
      complaintRisk: 0.15,
    };
  } else if (roll < 0.80) {
    return {
      type: 'heavy_luggage',
      label: 'Khách nhiều hành lý cồng kềnh',
      tipChance: 0.20,
      tipMin: 10000,
      tipMax: 25000,
      complaintRisk: 0.05,
    };
  } else if (roll < 0.90) {
    return {
      type: 'foreigner',
      label: 'Khách du lịch nước ngoài',
      tipChance: 0.45,
      tipMin: 20000,
      tipMax: 50000,
      complaintRisk: 0.03,
    };
  } else {
    return {
      type: 'picky',
      label: 'Khách khó tính / hay soi xét',
      tipChance: 0.05,
      tipMin: 5000,
      tipMax: 10000,
      complaintRisk: 0.20,
    };
  }
}

/**
 * Calculates fare for a ride or food delivery.
 */
export function calculateOrderFare(
  type: OrderType,
  distanceKm: number,
  isPeakHour: boolean,
  isRain: boolean,
  surge: number,
  tier: DriverApp['tier'],
  vehicleCategory: 'motorcycle' | 'motorcycle_electric' | 'car' = 'motorcycle'
): { grossFare: number; netFare: number; commission: number; rainBonus: number } {
  let gross = 0;
  let rainBonus = 0;

  if (type === 'food') {
    const config = pricingData.foodDelivery;
    gross = config.baseFee;
    if (distanceKm > config.baseDistanceKm) {
      gross += (distanceKm - config.baseDistanceKm) * config.perKmAfterBase;
    }
    if (isPeakHour) {
      gross *= 1 + config.peakHourBonusRatio;
    }
    if (isRain) {
      rainBonus = 7000;
      gross += rainBonus;
    }
    gross *= surge;
  } else {
    const isCar = vehicleCategory === 'car';
    const config = isCar
      ? pricingData.passengerRide.car4Seats
      : pricingData.passengerRide.motorcycle;

    gross = config.baseFee;
    if (distanceKm > config.baseDistanceKm) {
      gross += (distanceKm - config.baseDistanceKm) * config.perKmAfterBase;
    }
    if (isRain) {
      rainBonus = isCar ? 10000 : 5000;
      gross += rainBonus;
    }
    gross *= surge;
  }

  gross = Math.round(gross / 1000) * 1000;
  const commissionRate = getCommissionRate(tier);
  const commission = Math.round(gross * commissionRate);
  const netFare = gross - commission;

  return { grossFare: gross, netFare, commission, rainBonus };
}

/**
 * Hidden priority dispatch score according to Section 7:
 * score = 0.35·rating_norm + 0.25·acceptRate + 0.20·(1 − cancelRate) + 0.20·proximity_norm + ε (ε ~ N(0, 0.2))
 */
export function calculateHiddenDispatchScore(
  app: DriverApp,
  rng: RngState,
  spotDensityMultiplier = 1.0
): { score: number; dispatchFactor: number } {
  // rating_norm: map 4.0 - 5.0 to 0.0 - 1.0
  const ratingNorm = Math.max(0, Math.min(1.0, (app.rating - 4.0) / 1.0));
  const acceptRate = Math.max(0, Math.min(1.0, app.acceptanceRate));
  const cancelCompliment = Math.max(0, Math.min(1.0, 1.0 - app.cancellationRate));
  const proximityNorm = Math.max(0, Math.min(1.0, spotDensityMultiplier / 1.3));

  // Gaussian noise ε ~ N(0, 0.2) to simulate platform opacity and slight unpredictability
  const epsilon = nextGaussian(rng, 0, 0.2);

  const score =
    0.35 * ratingNorm +
    0.25 * acceptRate +
    0.20 * cancelCompliment +
    0.20 * proximityNorm +
    epsilon;

  const tierMultiplier = getDispatchPriority(app.tier);

  // Map score to dispatch factor (centered around 1.0)
  const dispatchFactor = Math.max(0.35, Math.min(2.2, (0.5 + score * 0.9) * tierMultiplier));
  return { score, dispatchFactor };
}

/**
 * Evaluates probability of an order arriving in 1 game minute.
 */
export function evaluateOrderArrivalProbability(
  time: GameTime,
  weather: WeatherState,
  app: DriverApp,
  currentZoneId: string,
  rng: RngState,
  spotDensityMultiplier = 1.0
): number {
  const currentZone = zonesData.find((z) => z.id === currentZoneId);
  const baseZone = currentZone ? currentZone.baseDemandMultiplier : 1.0;

  const rideDemand = getDemandForHour(time.hour, 'ride', time.dayOfWeek, weather, currentZoneId === 'khu_bar_dem');
  const foodDemand = getDemandForHour(time.hour, 'food', time.dayOfWeek, weather);
  const avgDemand = (rideDemand + foodDemand) / 2;

  // Calculate hidden score with Gaussian noise
  const { dispatchFactor } = calculateHiddenDispatchScore(app, rng, spotDensityMultiplier);

  // Arrival rate per minute
  const lambda = 0.24 * baseZone * avgDemand * spotDensityMultiplier * dispatchFactor;
  return Math.min(0.70, Math.max(0.06, lambda));
}

/**
 * Generate a new random order offer.
 */
export function generateOrderOffer(
  rng: RngState,
  time: GameTime,
  weather: WeatherState,
  app: DriverApp,
  currentZoneId: string,
  vehicleCategory: 'motorcycle' | 'motorcycle_electric' | 'car' = 'motorcycle'
): TripOrder {
  const isLateNight = time.hour >= 22 || time.hour < 5;
  const isBarZone = currentZoneId === 'khu_bar_dem';

  // Determine order type: food peaks at 11:30 - 13:00 and 18:00 - 20:00
  const isMealHour = (time.hour >= 11 && time.hour <= 13) || (time.hour >= 18 && time.hour <= 20);
  const foodRoll = nextFloat(rng);
  
  // Cars cannot do food delivery in narrow alleys
  let type: OrderType = 'ride';
  if (vehicleCategory !== 'car') {
    type = (isMealHour && foodRoll < 0.70) || (!isMealHour && foodRoll < 0.40) ? 'food' : 'ride';
  }

  // Choose pickup and dropoff zones
  const pickupZoneId = currentZoneId;
  const currentZone = zonesData.find((z) => z.id === currentZoneId);
  let dropoffZoneId = currentZoneId;
  if (currentZone && currentZone.connections.length > 0) {
    if (nextFloat(rng) < 0.75) {
      // Connect to a neighbouring zone
      const conn = choose(rng, currentZone.connections);
      dropoffZoneId = conn.target;
    }
  }

  const dropoffZone = zonesData.find((z) => z.id === dropoffZoneId);
  const dropoffName = dropoffZone ? dropoffZone.name : 'Quận trung tâm';

  // Distances
  const pickupDistanceKm = Number((0.4 + nextFloat(rng) * 1.6).toFixed(1)); // 0.4 - 2.0 km
  const tripDistanceKm = Number((1.5 + nextFloat(rng) * 6.5).toFixed(1));   // 1.5 - 8.0 km

  // Surge calculation
  let surge = 1.0;
  if (isMealHour || (time.hour >= 7 && time.hour <= 8.5) || (time.hour >= 17 && time.hour <= 19)) {
    surge = 1.15 + nextFloat(rng) * 0.35; // 1.15x - 1.5x
  }
  if (weather.type === 'heavy_rain' || weather.type === 'storm') {
    surge = Math.min(1.8, surge * 1.25);
  }

  const isPeak = isMealHour || (time.hour >= 7 && time.hour <= 9) || (time.hour >= 17 && time.hour <= 19);
  const isRain = weather.type === 'light_rain' || weather.type === 'heavy_rain' || weather.type === 'storm';

  const fareRes = calculateOrderFare(type, tripDistanceKm, isPeak, isRain, surge, app.tier, vehicleCategory);

  const customerName = choose(rng, VIETNAMESE_NAMES);
  const profile = getRandomCustomerProfile(rng, isBarZone, isLateNight);

  const paymentMethod: PaymentMethod = nextFloat(rng) < 0.45 ? 'cash' : 'digital';

  let foodItems: string | undefined;
  let isFragile: boolean | undefined;
  let merchantPrepMinutes: number | undefined;

  if (type === 'food') {
    const food = choose(rng, FOOD_ITEMS);
    foodItems = food.name;
    isFragile = food.fragile;
    // Log-normal-like prep time: 5 - 12 mins, extended in peak hours
    merchantPrepMinutes = nextInt(rng, 5, 10);
    if (isPeak) merchantPrepMinutes += nextInt(rng, 2, 5);
  }

  const id = `order_${Date.now()}_${nextInt(rng, 100, 999)}`;
  const title = type === 'food'
    ? `Giao đồ ăn: ${foodItems}`
    : vehicleCategory === 'car'
    ? `Chở khách (Car 4 chỗ): Đi ${dropoffName}`
    : `Chở khách: Đi ${dropoffName}`;

  return {
    id,
    type,
    title,
    customerName,
    customerProfile: profile,
    pickupZoneId,
    dropoffZoneId,
    pickupAddress: `Điểm đón tại ${currentZone?.name || 'TP.HCM'}`,
    dropoffAddress: `Giao tới ${dropoffName}`,
    pickupDistanceKm,
    tripDistanceKm,
    grossFare: fareRes.grossFare,
    netFare: fareRes.netFare,
    platformCommission: fareRes.commission,
    surgeMultiplier: Number(surge.toFixed(2)),
    paymentMethod,
    isPeakHour: isPeak,
    rainBonus: fareRes.rainBonus,
    foodItems,
    isFragile,
    merchantPrepMinutes,
    stage: 'OFFERED',
    stageMinutesRemaining: 0,
    countdownSeconds: 12,
  };
}
