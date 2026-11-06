import demandData from '../../data/demand.json';
import { WeatherState, DayOfWeek } from './types';

export function getDemandForHour(
  hour: number,
  type: 'ride' | 'food',
  dayOfWeek: DayOfWeek,
  weather: WeatherState,
  isBarZone = false
): number {
  const curve = type === 'ride' ? demandData.hourlyCurve.ride : demandData.hourlyCurve.food;
  const baseRate = curve[hour] ?? 0.5;

  let multiplier = 1.0;

  // Weekend adjustments
  const isWeekend = dayOfWeek === 6 || dayOfWeek === 7;
  if (isWeekend) {
    if (type === 'food') {
      multiplier *= demandData.weekendModifiers.residentialFoodMultiplier;
    } else if (isBarZone && hour >= 22) {
      multiplier *= demandData.weekendModifiers.barRideAfter2230Multiplier;
    }
  }

  // Weather adjustments
  if (weather.type === 'light_rain' || weather.type === 'heavy_rain' || weather.type === 'storm') {
    if (type === 'food') {
      multiplier *= demandData.rainModifiers.foodMultiplier;
    } else {
      multiplier *= demandData.rainModifiers.rideMultiplier;
    }
  }

  return baseRate * multiplier;
}
