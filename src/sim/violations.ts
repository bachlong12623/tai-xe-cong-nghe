import violationsData from '../../data/violations.json';
import zonesData from '../../data/zones.json';
import { RngState, nextFloat, nextInt } from './rng';
import { DrivingStyle, PoliceFineEvent } from './types';

export function checkPoliceViolation(
  rng: RngState,
  drivingStyle: DrivingStyle,
  zoneId: string,
  activeCsgtZones: string[],
  _timeFormatted?: string
): PoliceFineEvent | null {
  if (drivingStyle === 'safe' || drivingStyle === 'normal') {
    return null;
  }

  const styleDef = violationsData.drivingStyles.find((s) => s.id === drivingStyle);
  if (!styleDef || !styleDef.policeRisk) {
    return null;
  }

  const roll = nextFloat(rng);
  const zoneWeight = (violationsData.policeZoneWeights as Record<string, number>)[zoneId] ?? 1.0;
  const isCsgtActiveInZone = activeCsgtZones.includes(zoneId);
  const multiplier = isCsgtActiveInZone ? 1.8 : 1.0;

  const finalRisk = styleDef.policeRisk * zoneWeight * multiplier;

  if (roll < finalRisk) {
    // Caught by police!
    const minFine = styleDef.fineMin ?? 400000;
    const maxFine = styleDef.fineMax ?? 600000;
    const fineAmount = Math.round(nextInt(rng, minFine, maxFine) / 50000) * 50000;

    const zoneObj = zonesData.find((z) => z.id === zoneId);
    const zoneName = zoneObj ? zoneObj.name : zoneId;

    const reason =
      drivingStyle === 'rush'
        ? `Vượt đèn đỏ tại giao lộ ${zoneName}`
        : `Đi ngược chiều / Leo vỉa hè tại ${zoneName}`;

    return {
      reason,
      fineAmount,
      zoneName,
    };
  }

  return null;
}
