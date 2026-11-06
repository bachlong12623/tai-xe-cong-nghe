import { WeatherState, WeatherType } from './types';
import { RngState, nextFloat } from './rng';

export function createInitialWeather(): WeatherState {
  return {
    type: 'sunny',
    temperature: 29,
    isFlooded: false,
  };
}

/**
 * Calculates base temperature in TP.HCM by hour (26°C at 5:00, up to 35-36°C at 13:00 - 14:00).
 */
export function getBaseTemperature(hour: number): number {
  if (hour >= 0 && hour < 6) return 26;
  if (hour >= 6 && hour < 9) return 28;
  if (hour >= 9 && hour < 12) return 32;
  if (hour >= 12 && hour < 15) return 35;
  if (hour >= 15 && hour < 18) return 32;
  if (hour >= 18 && hour < 21) return 29;
  return 27;
}

/**
 * Step weather every hour or check transitions.
 */
export function updateWeather(weather: WeatherState, hour: number, rng: RngState): WeatherState {
  let baseTemp = getBaseTemperature(hour);

  // Transition probabilities
  const roll = nextFloat(rng);
  let nextType: WeatherType = weather.type;

  if (weather.type === 'sunny') {
    if (roll < 0.15) nextType = 'cloudy';
    else if (roll < 0.20 && hour >= 13 && hour <= 18) nextType = 'light_rain';
  } else if (weather.type === 'cloudy') {
    if (roll < 0.25) nextType = 'sunny';
    else if (roll < 0.50 && hour >= 13 && hour <= 18) nextType = 'light_rain';
    else if (roll < 0.60 && hour >= 13 && hour <= 18) nextType = 'heavy_rain';
  } else if (weather.type === 'light_rain') {
    baseTemp -= 3;
    if (roll < 0.40) nextType = 'cloudy';
    else if (roll < 0.60) nextType = 'heavy_rain';
  } else if (weather.type === 'heavy_rain' || weather.type === 'storm') {
    baseTemp -= 4;
    if (roll < 0.50) nextType = 'light_rain';
    else if (roll < 0.70) nextType = 'cloudy';
  }

  return {
    type: nextType,
    temperature: baseTemp,
    isFlooded: (nextType === 'heavy_rain' || nextType === 'storm'),
  };
}
