import { describe, it, expect } from 'vitest';
import {
  createDefaultSkills,
  addSkillExp,
  getTravelTimeMultiplier,
  getTipChanceBonus,
  getAccidentRiskMultiplier,
  getFoodDamageReduction,
  getMoraleLossReduction,
} from '../../src/sim/skills';

describe('Driver Skills Progression - Milestone 5 Specification', () => {
  it('initializes all 5 skills at Level 0 with 0 EXP', () => {
    const skills = createDefaultSkills();
    expect(skills.streetKnowledge.level).toBe(0);
    expect(skills.communication.level).toBe(0);
    expect(skills.itemHandling.level).toBe(0);
    expect(skills.defensiveDriving.level).toBe(0);
    expect(skills.stressResilience.level).toBe(0);
  });

  it('levels up skills when EXP thresholds are crossed', () => {
    let skills = createDefaultSkills();
    const logs: any[] = [];

    // Add 120 EXP -> reaches level 1 (threshold is 100)
    skills = addSkillExp(skills, 'streetKnowledge', 120, logs, 60, '06:00');
    expect(skills.streetKnowledge.level).toBe(1);
    expect(skills.streetKnowledge.exp).toBe(120);
    expect(logs.length).toBe(1);
    expect(logs[0].text).toContain('KỸ NĂNG LÊN CẤP');

    // Add 150 EXP more -> 270 EXP -> reaches level 2 (threshold is 250)
    skills = addSkillExp(skills, 'streetKnowledge', 150, logs, 120, '07:00');
    expect(skills.streetKnowledge.level).toBe(2);
    expect(skills.streetKnowledge.exp).toBe(270);
  });

  it('applies measurable effect: travel time reduction with Thuộc đường', () => {
    const lvl0 = createDefaultSkills();
    const mult0 = getTravelTimeMultiplier(lvl0, 'normal');
    expect(mult0).toBe(1.0);

    const lvl5 = {
      ...createDefaultSkills(),
      streetKnowledge: { level: 5, exp: 2500 },
    };
    const mult5 = getTravelTimeMultiplier(lvl5, 'normal');
    // 5 * 3% = 15% reduction -> 0.85
    expect(mult5).toBeCloseTo(0.85, 2);

    // Driving style speedup
    const multRush = getTravelTimeMultiplier(lvl5, 'rush');
    expect(multRush).toBeLessThan(mult5);
  });

  it('applies measurable effect: communication increases tip probability', () => {
    const lvl0 = createDefaultSkills();
    expect(getTipChanceBonus(lvl0)).toBe(0);

    const lvl3 = {
      ...createDefaultSkills(),
      communication: { level: 3, exp: 600 },
    };
    // +3% per level -> +9%
    expect(getTipChanceBonus(lvl3)).toBeCloseTo(0.09, 2);
  });

  it('applies measurable effect: defensive driving reduces accident risk', () => {
    const lvl0 = createDefaultSkills();
    expect(getAccidentRiskMultiplier(lvl0, 'normal')).toBe(1.0);

    const lvl5 = {
      ...createDefaultSkills(),
      defensiveDriving: { level: 5, exp: 2000 },
    };
    // 5 * 6% = 30% reduction -> 0.70
    expect(getAccidentRiskMultiplier(lvl5, 'normal')).toBeCloseTo(0.70, 2);
  });

  it('applies measurable effect: item handling and stress resilience', () => {
    const skills = {
      ...createDefaultSkills(),
      itemHandling: { level: 4, exp: 1200 },
      stressResilience: { level: 3, exp: 700 },
    };

    expect(getFoodDamageReduction(skills)).toBeCloseTo(0.60, 2); // 4 * 15% = 60%
    expect(getMoraleLossReduction(skills)).toBeCloseTo(0.30, 2); // 3 * 10% = 30%
  });
});
