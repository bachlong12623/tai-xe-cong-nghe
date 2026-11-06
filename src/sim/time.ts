import { GameTime, DayOfWeek } from './types';

export const MINUTES_PER_DAY = 1440;
export const DEFAULT_START_HOUR = 5;
export const DEFAULT_START_MINUTE = 0;

export function createInitialTime(): GameTime {
  return {
    day: 1,
    dayOfWeek: 1, // Thứ 2
    hour: DEFAULT_START_HOUR,
    minute: DEFAULT_START_MINUTE,
    totalMinutes: DEFAULT_START_HOUR * 60 + DEFAULT_START_MINUTE,
  };
}

export function formatDayOfWeek(dayOfWeek: DayOfWeek): string {
  switch (dayOfWeek) {
    case 1: return 'Thứ Hai';
    case 2: return 'Thứ Ba';
    case 3: return 'Thứ Tư';
    case 4: return 'Thứ Năm';
    case 5: return 'Thứ Sáu';
    case 6: return 'Thứ Bảy';
    case 7: return 'Chủ Nhật';
  }
}

export function formatTime24h(hour: number, minute: number): string {
  const h = hour.toString().padStart(2, '0');
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function formatGameTime(time: GameTime): string {
  return `${formatDayOfWeek(time.dayOfWeek)}, ${formatTime24h(time.hour, time.minute)} (Ngày ${time.day})`;
}

export function isNightHour(hour: number): boolean {
  return hour >= 23 || hour < 5;
}

export interface AdvanceTimeResult {
  newTime: GameTime;
  dayChanged: boolean;
  isNewDayStartHour: boolean; // Trigger at 05:00 daily
}

export function advanceTime(current: GameTime, minutesToAdd: number): AdvanceTimeResult {
  const total = current.totalMinutes + minutesToAdd;
  const currentTotalDays = Math.floor(current.totalMinutes / MINUTES_PER_DAY);
  const newTotalDays = Math.floor(total / MINUTES_PER_DAY);
  const dayChanged = newTotalDays > currentTotalDays;
  
  const minuteOfDay = total % MINUTES_PER_DAY;
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  
  const day = 1 + newTotalDays;
  const dayOfWeek = (((day - 1) % 7) + 1) as DayOfWeek;

  // New day cycle trigger check: did we pass 05:00:00?
  const prevMinOfDay = current.totalMinutes % MINUTES_PER_DAY;
  const passed5Am = (prevMinOfDay < 300 && minuteOfDay >= 300) || (dayChanged && minuteOfDay >= 300);

  return {
    newTime: {
      day,
      dayOfWeek,
      hour,
      minute,
      totalMinutes: total,
    },
    dayChanged,
    isNewDayStartHour: passed5Am,
  };
}
