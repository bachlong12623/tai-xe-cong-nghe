import npcData from '../../data/npc.json';
import zonesData from '../../data/zones.json';
import { RngState, nextFloat, choose } from './rng';
import { NpcMessage, WeatherState, GameTime } from './types';

export function getActiveCsgtZones(rng: RngState, hour: number): string[] {
  // CSGT is more active during rush hours (07-09, 17-19) and night (22-01)
  const isHighPoliceTime = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) || (hour >= 22 || hour <= 1);
  const checkpointCount = isHighPoliceTime ? 3 : 2;

  // Potential zones
  const candidateZones = ['q1', 'binh_thanh', 'tan_binh', 'q5_10', 'q12', 'khu_bar_dem'];
  const selected: string[] = [];

  for (let i = 0; i < checkpointCount; i++) {
    const chosen = choose(rng, candidateZones);
    if (!selected.includes(chosen)) {
      selected.push(chosen);
    }
  }

  return selected;
}

export function maybeGenerateNpcMessage(
  rng: RngState,
  time: GameTime,
  weather: WeatherState,
  activeCsgtZones: string[],
  _existingMessages: NpcMessage[]
): NpcMessage | null {
  // Chance to emit a message every 30 game minutes
  if (time.minute % 30 !== 0) {
    return null;
  }

  const roll = nextFloat(rng);
  // 75% chance of generating a message on interval
  if (roll > 0.75) {
    return null;
  }

  // Pick type based on context
  let category: 'traffic' | 'police' | 'flood' | 'demand' | 'merchant' | 'chatter' = 'chatter';
  if (weather.isFlooded && roll < 0.4) {
    category = 'flood';
  } else if (activeCsgtZones.length > 0 && roll < 0.6) {
    category = 'police';
  } else if ((time.hour >= 7 && time.hour <= 9) || (time.hour >= 16 && time.hour <= 19)) {
    category = 'traffic';
  } else if ((time.hour >= 11 && time.hour <= 13) || (time.hour >= 18 && time.hour <= 20)) {
    category = 'merchant';
  } else {
    category = roll < 0.5 ? 'demand' : 'chatter';
  }

  // Select random template
  const templates = npcData.templates[category] ?? npcData.templates.chatter;
  const rawTemplate = choose(rng, templates);

  // Pick target zone
  let targetZoneId = 'q1';
  if (category === 'police' && activeCsgtZones.length > 0) {
    targetZoneId = choose(rng, activeCsgtZones);
  } else if (category === 'flood') {
    targetZoneId = roll < 0.5 ? 'binh_thanh' : 'q4_7';
  } else {
    targetZoneId = choose(rng, zonesData).id;
  }

  const zoneObj = zonesData.find((z) => z.id === targetZoneId);
  const zoneName = zoneObj ? zoneObj.name : 'Trung tâm';

  // Format content
  const content = rawTemplate.replace('{zone}', zoneName);

  // Pick appropriate NPC
  const npc = choose(rng, npcData.npcs);
  const timeFormatted = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;

  return {
    id: `npc-msg-${time.totalMinutes}-${npc.id}`,
    npcId: npc.id,
    npcName: npc.name,
    avatar: npc.avatar,
    zoneId: targetZoneId,
    content,
    timestampFormatted: timeFormatted,
    reliability: npc.reliability,
    type: category,
  };
}
