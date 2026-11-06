import { WeatherState, GameTime } from './types';

export function getTrafficMultiplier(time: GameTime): number {
  const hour = time.hour;
  const minute = time.minute;
  const timeVal = hour + minute / 60;

  // Morning rush hour: 07:00 - 09:00
  if (timeVal >= 7.0 && timeVal <= 9.0) {
    return 0.55;
  }
  // Evening rush hour: 17:00 - 19:30
  if (timeVal >= 17.0 && timeVal <= 19.5) {
    return 0.55;
  }
  // Daytime normal: 09:00 - 17:00 & 19:30 - 22:30
  if (timeVal > 9.0 && timeVal < 17.0) {
    return 0.85;
  }
  if (timeVal > 19.5 && timeVal <= 22.5) {
    return 0.85;
  }
  // Night: 22:30 - 07:00
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

export function calculateTravelTimeMinutes(
  distanceKm: number,
  freeSpeedKph = 30,
  time: GameTime,
  weather: WeatherState,
  stamina: number
): number {
  const trafficMult = getTrafficMultiplier(time);
  const weatherMult = getWeatherSpeedMultiplier(weather);
  const staminaMult = stamina < 25 ? 0.8 : 1.0;

  const actualSpeedKph = Math.max(10, freeSpeedKph * trafficMult * weatherMult * staminaMult);
  const travelHours = distanceKm / actualSpeedKph;
  // + 1-2 minutes for traffic lights / finding parking
  const minutes = Math.ceil(travelHours * 60 + 1.5);
  return Math.max(2, minutes);
}

export function calculateFuelConsumed(
  distanceKm: number,
  fuelConsumptionPer100Km = 1.9
): number {
  return (distanceKm * fuelConsumptionPer100Km) / 100;
}
