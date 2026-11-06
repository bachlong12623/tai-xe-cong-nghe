import { describe, it } from 'vitest';
import { runBotSimulation, BotStrategy } from '../../src/sim/bot';

describe('Benchmark 4 Bots Multi-Seed (Section 19)', () => {
  const seeds = [42, 101, 202, 303, 777];

  it('runs multi-seed benchmark and prints summary table', () => {
    const strategies: BotStrategy[] = ['balanced', 'workaholic', 'lazy', 'peak_hunter'];
    const results: Record<string, any> = {};

    for (const strat of strategies) {
      const days = strat === 'balanced' ? 30 : 7;
      const runs = seeds.map((s) => runBotSimulation(strat, days, s));

      const survivedArr = runs.map((r) => r.daysSurvived);
      const tripsArr = runs.map((r) => r.totalTrips);
      const profitArr = runs.map((r) => r.totalNetProfit);
      const collapsedCount = runs.filter((r) => r.collapsed).length;

      const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
      const min = (arr: number[]) => Math.min(...arr);
      const max = (arr: number[]) => Math.max(...arr);

      results[strat] = {
        daysTarget: days,
        avgDays: avg(survivedArr),
        minDays: min(survivedArr),
        maxDays: max(survivedArr),
        avgTrips: avg(tripsArr),
        minTrips: min(tripsArr),
        maxTrips: max(tripsArr),
        avgProfit: avg(profitArr),
        minProfit: min(profitArr),
        maxProfit: max(profitArr),
        collapseRate: `${(collapsedCount / runs.length) * 100}%`,
      };
    }

    console.table(results);
  });
});
