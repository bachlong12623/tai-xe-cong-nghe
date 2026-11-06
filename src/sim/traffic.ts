import { WeatherState, GameTime, VehicleCondition, AccidentEvent } from './types';
import { RngState, nextFloat, nextInt } from './rng';

export function getTrafficMultiplier(time: GameTime, routeMode: 'fast' | 'light' | 'dry' = 'fast'): number {
  const timeVal = time.hour + time.minute / 60;
  const isRushHour = (timeVal >= 7.0 && timeVal <= 9.0) || (timeVal >= 17.0 && timeVal <= 19.5);
  const isDaytime = (timeVal > 9.0 && timeVal < 17.0) || (timeVal > 19.5 && timeVal <= 22.5);

  if (routeMode === 'light') {
    // Light traffic route avoids main bottlenecks
    if (isRushHour) return 0.75;
    if (isDaytime) return 0.90;
    return 1.0;
  }

  // Fast route takes main avenues (heavy traffic during peak)
  if (isRushHour) return 0.55;
  if (isDaytime) return 0.85;
  return 1.0;
}

export function getWeatherSpeedMultiplier(weather: WeatherState): number {
  if (weather.type === 'heavy_rain' || weather.type === 'storm') {
    return 0.65;
  }
  if (weather.type === 'light_rain') {
    return 0.80;
  }
  return 1.0;
}

export function calculateTravelDistance(baseDistanceKm: number, routeMode: 'fast' | 'light' | 'dry' = 'fast'): number {
  if (routeMode === 'light') return baseDistanceKm * 1.15;
  if (routeMode === 'dry') return baseDistanceKm * 1.25;
  return baseDistanceKm;
}

export function calculateTravelTimeMinutes(
  distanceKm: number,
  freeSpeedKph = 30,
  time: GameTime,
  weather: WeatherState,
  stamina: number,
  routeMode: 'fast' | 'light' | 'dry' = 'fast'
): number {
  const trafficMult = getTrafficMultiplier(time, routeMode);
  const weatherMult = getWeatherSpeedMultiplier(weather);
  const staminaMult = stamina < 25 ? 0.8 : 1.0;

  const actualSpeedKph = Math.max(10, freeSpeedKph * trafficMult * weatherMult * staminaMult);
  const travelHours = distanceKm / actualSpeedKph;
  const minutes = Math.ceil(travelHours * 60 + 1.5);
  return Math.max(2, minutes);
}

export function calculateFuelConsumed(
  distanceKm: number,
  fuelConsumptionPer100Km = 1.9
): number {
  return (distanceKm * fuelConsumptionPer100Km) / 100;
}

/**
 * Calculates hourly accident probability according to Section 10 formula:
 * P = 0.0015 * speedMode * rain * night * (1 + max(0, (30 - alert)/30)) * (1 + max(0, (50 - min(tire, brake))/50))
 */
export function calculateAccidentHourlyProbability(
  alertness: number,
  vehicleCond: VehicleCondition,
  isRain: boolean,
  isNight: boolean,
  isSpeedFast = false
): number {
  const speedMult = isSpeedFast ? 1.3 : 1.0;
  const rainMult = isRain ? 2.0 : 1.0;
  const nightMult = isNight ? 1.4 : 1.0;

  const alertnessFactor = 1 + Math.max(0, (30 - alertness) / 30);
  const worstTireBrake = Math.min(vehicleCond.tires, vehicleCond.brakes);
  const tireBrakeFactor = 1 + Math.max(0, (50 - worstTireBrake) / 50);

  const baseP = 0.0015;
  const hourlyProbability = baseP * speedMult * rainMult * nightMult * alertnessFactor * tireBrakeFactor;
  return Math.min(0.20, hourlyProbability);
}

/**
 * Evaluates whether an accident occurs in this driving minute.
 */
export function rollForAccident(
  alertness: number,
  vehicleCond: VehicleCondition,
  weather: WeatherState,
  time: GameTime,
  rng: RngState
): AccidentEvent | null {
  const isRain = weather.type === 'light_rain' || weather.type === 'heavy_rain' || weather.type === 'storm';
  const isNight = time.hour >= 23 || time.hour < 5;

  const hourlyP = calculateAccidentHourlyProbability(alertness, vehicleCond, isRain, isNight);
  const minuteP = hourlyP / 60;

  if (nextFloat(rng) > minuteP) {
    return null;
  }

  // Accident occurred! Roll for severity:
  const sevRoll = nextFloat(rng);
  if (sevRoll < 0.70) {
    // Light
    const repairCost = Math.round(nextInt(rng, 250000, 600000) / 10000) * 10000;
    return {
      severity: 'light',
      title: 'Va quẹt nhẹ trên đường',
      description: 'Đường trơn thắng gấp khiến xe bị trượt bánh, va quẹt vào đuôi xe phía trước làm cong gác chân và trầy bửng.',
      repairCost,
      medicalCost: 0,
      daysOff: 0,
      healthPenalty: 3,
      moralePenalty: 8,
    };
  } else if (sevRoll < 0.93) {
    // Moderate
    const repairCost = Math.round(nextInt(rng, 1200000, 2800000) / 50000) * 50000;
    return {
      severity: 'moderate',
      title: 'Tai nạn ngã xe chấn thương phần mềm',
      description: 'Mắt díp lại vì buồn ngủ, bánh xe trượt rãnh nắp cống khiến bạn ngã văng ra đường. Xe vỡ yếm, người trầy xước bầm dập.',
      repairCost,
      medicalCost: 350000,
      daysOff: 1,
      healthPenalty: 12,
      moralePenalty: 18,
    };
  } else {
    // Severe
    const repairCost = Math.round(nextInt(rng, 3500000, 6500000) / 100000) * 100000;
    const medicalCost = Math.round(nextInt(rng, 5000000, 15000000) / 500000) * 500000;
    return {
      severity: 'severe',
      title: 'Tai nạn giao thông nghiêm trọng',
      description: 'Mất lái lúc đêm khuya tông phải dải phân cách. Bạn phải nhập viện cấp cứu kiểm tra xương khớp và nằm viện điều trị!',
      repairCost,
      medicalCost,
      daysOff: 4,
      healthPenalty: 30,
      moralePenalty: 28,
    };
  }
}

/**
 * Checks for flood engine stalling when traversing a flooded zone.
 */
export function checkFloodStallRisk(
  isFloodedZone: boolean,
  routeMode: 'fast' | 'light' | 'dry',
  sparkPlugCondition: number,
  rng: RngState
): boolean {
  if (!isFloodedZone || routeMode === 'dry') return false;

  // Base 15% stall chance in flooded road
  let stallChance = 0.15;
  if (sparkPlugCondition < 50) {
    stallChance = 0.35; // weak spark plug stalls easily
  }

  return nextFloat(rng) < stallChance;
}
