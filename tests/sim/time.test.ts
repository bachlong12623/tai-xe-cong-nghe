import { describe, it, expect } from 'vitest';
import { createInitialTime, advanceTime, isNightHour, formatGameTime } from '../../src/sim/time';

describe('Time System - 24h cycle & tick', () => {
  it('initializes at Day 1, Monday 05:00', () => {
    const time = createInitialTime();
    expect(time.day).toBe(1);
    expect(time.dayOfWeek).toBe(1);
    expect(time.hour).toBe(5);
    expect(time.minute).toBe(0);
    expect(time.totalMinutes).toBe(300);
    expect(formatGameTime(time)).toContain('Thứ Hai, 05:00 (Ngày 1)');
  });

  it('advances minutes and hours correctly', () => {
    const t0 = createInitialTime();
    const res = advanceTime(t0, 90); // 1h 30m
    expect(res.newTime.hour).toBe(6);
    expect(res.newTime.minute).toBe(30);
    expect(res.dayChanged).toBe(false);
  });

  it('rolls over 24h into Day 2 (Tuesday)', () => {
    const t0 = createInitialTime();
    const res = advanceTime(t0, 1440); // 24 hours
    expect(res.newTime.day).toBe(2);
    expect(res.newTime.dayOfWeek).toBe(2);
    expect(res.newTime.hour).toBe(5);
    expect(res.newTime.minute).toBe(0);
    expect(res.dayChanged).toBe(true);
  });

  it('identifies night hours correctly (23:00 - 05:00)', () => {
    expect(isNightHour(23)).toBe(true);
    expect(isNightHour(0)).toBe(true);
    expect(isNightHour(4)).toBe(true);
    expect(isNightHour(5)).toBe(false);
    expect(isNightHour(12)).toBe(false);
    expect(isNightHour(22)).toBe(false);
  });
});

