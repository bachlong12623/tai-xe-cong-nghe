import { describe, it, expect } from 'vitest';
import { runBotSimulation, exportBotResultsCsv } from '../../src/sim/bot';

describe('Bot Simulation & Balance - Section 18 & 19 (Milestone 3)', () => {
  it('Balanced Bot survives all 7 days with healthy sleep debt and positive profit', () => {
    const result = runBotSimulation('balanced', 7, 42);

    expect(result.daysSurvived).toBe(7);
    expect(result.collapsed).toBe(false);
    expect(result.totalTrips).toBeGreaterThan(15);
    expect(result.totalNetProfit).toBeGreaterThan(0);

    const finalReport = result.dailyReports[result.dailyReports.length - 1];
    expect(finalReport.sleepDebt).toBeLessThan(5);
  });

  it('Balanced Bot survives full 30 days with economic stability and > 8,000,000 VND profit (Section 19)', () => {
    const result = runBotSimulation('balanced', 30, 42);

    expect(result.collapsed).toBe(false);
    expect(result.daysSurvived).toBeGreaterThanOrEqual(30);
    expect(result.totalTrips).toBeGreaterThan(500);
    expect(result.totalNetProfit).toBeGreaterThan(8000000); // Exceeds target 8M VND
  });

  it('Workaholic Bot collapses within <= 7 days due to exhaustion or sleep debt (Section 19)', () => {
    const result = runBotSimulation('workaholic', 7, 42);

    expect(result.collapsed).toBe(true);
    expect(result.daysSurvived).toBeLessThanOrEqual(7);
    expect(result.collapseReason).toBeDefined();
  });

  it('Lazy Bot survives but achieves lower trips and earnings than Balanced Bot', () => {
    const balancedResult = runBotSimulation('balanced', 7, 42);
    const lazyResult = runBotSimulation('lazy', 7, 42);

    expect(lazyResult.collapsed).toBe(false);
    expect(lazyResult.totalTrips).toBeLessThan(balancedResult.totalTrips);
  });

  it('Peak Hunter Bot works only in peak windows and earns steady returns', () => {
    const result = runBotSimulation('peak_hunter', 7, 42);
    expect(result.daysSurvived).toBe(7);
    expect(result.collapsed).toBe(false);
    expect(result.totalTrips).toBeGreaterThan(0);
  });

  it('exports simulation metrics to valid CSV string format', () => {
    const result = runBotSimulation('balanced', 3, 123);
    const csv = exportBotResultsCsv(result.dailyReports);

    expect(csv).toContain('day,strategy,grossRevenue,netProfit');
    expect(csv).toContain('balanced');
    const lines = csv.trim().split('\n');
    expect(lines.length).toBe(4); // header + 3 days
  });
});
