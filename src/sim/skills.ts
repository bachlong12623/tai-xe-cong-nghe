import skillsData from '../../data/skills.json';
import { DriverSkills, DrivingStyle, LogMessage } from './types';

export function createDefaultSkills(): DriverSkills {
  return {
    streetKnowledge: { level: 0, exp: 0 },
    communication: { level: 0, exp: 0 },
    itemHandling: { level: 0, exp: 0 },
    defensiveDriving: { level: 0, exp: 0 },
    stressResilience: { level: 0, exp: 0 },
  };
}

export function getXpThresholdForNextLevel(currentLevel: number): number {
  const def = skillsData.skills[0]; // same thresholds for all
  if (currentLevel >= def.maxLevel) return Infinity;
  return def.xpThresholds[currentLevel + 1] ?? Infinity;
}

export function addSkillExp(
  skills: DriverSkills,
  skillId: keyof DriverSkills,
  amount: number,
  logs: LogMessage[],
  minute: number,
  timeFormatted: string
): DriverSkills {
  const currentSkill = skills[skillId];
  if (!currentSkill) return skills;

  const newExp = currentSkill.exp + amount;
  const def = skillsData.skills.find((s) => s.id === skillId);
  const maxLevel = def?.maxLevel ?? 5;
  const thresholds = def?.xpThresholds ?? [0, 100, 250, 500, 1000, 2000];

  let newLevel = currentSkill.level;
  while (newLevel < maxLevel && newExp >= thresholds[newLevel + 1]) {
    newLevel++;
    logs.unshift({
      id: `skill-up-${skillId}-${newLevel}-${minute}`,
      minute,
      timeFormatted,
      text: `⭐ KỸ NĂNG LÊN CẤP! [${def?.name ?? skillId}] đạt Cấp ${newLevel}!`,
      type: 'success',
    });
  }

  return {
    ...skills,
    [skillId]: {
      level: newLevel,
      exp: newExp,
    },
  };
}

export function getTravelTimeMultiplier(skills: DriverSkills, style: DrivingStyle = 'normal'): number {
  // Street knowledge reduces travel time: -3% per level up to level 5 (-15%)
  const skillReduction = (skills.streetKnowledge.level * 3) / 100;
  
  let styleModifier = 1.0;
  if (style === 'safe') styleModifier = 1.05;
  else if (style === 'rush') styleModifier = 0.88;
  else if (style === 'shortcut') styleModifier = 0.80;

  return Math.max(0.65, (1.0 - skillReduction) * styleModifier);
}

export function getTipChanceBonus(skills: DriverSkills): number {
  // Communication skill: +3% chance per level
  return (skills.communication.level * 0.03);
}

export function getAccidentRiskMultiplier(skills: DriverSkills, style: DrivingStyle = 'normal'): number {
  // Defensive driving: -6% risk per level
  const skillReduction = (skills.defensiveDriving.level * 0.06);

  let styleModifier = 1.0;
  if (style === 'safe') styleModifier = 0.70;
  else if (style === 'rush') styleModifier = 1.30;
  else if (style === 'shortcut') styleModifier = 1.50;

  return Math.max(0.3, (1.0 - skillReduction) * styleModifier);
}

export function getFoodDamageReduction(skills: DriverSkills): number {
  // Item handling: -15% chance of food spill per level
  return Math.min(0.75, (skills.itemHandling.level * 0.15));
}

export function getMoraleLossReduction(skills: DriverSkills): number {
  // Stress resilience: -10% morale drop per level
  return Math.min(0.50, (skills.stressResilience.level * 0.10));
}
