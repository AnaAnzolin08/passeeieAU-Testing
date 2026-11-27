const HEAT_LIMIT_C = 27;
const HEAT_BLOCK_START_MINUTES = 9 * 60;
const HEAT_BLOCK_END_MINUTES = 16 * 60;

export function evaluateWalkSafety(
  temperatureC: number,
  hasRain: boolean,
  observedAt: string,
): { excessiveHeat: boolean; blockedByHeat: boolean; canWalk: boolean } {
  const excessiveHeat = temperatureC > HEAT_LIMIT_C;
  const timeMatch = /T(\d{2}):(\d{2})/.exec(observedAt);

  if (excessiveHeat && !timeMatch) {
    throw new Error('Horário da previsão climática inválido.');
  }

  const hour = timeMatch ? Number(timeMatch[1]) : 0;
  const minute = timeMatch ? Number(timeMatch[2]) : 0;
  if (timeMatch && (hour > 23 || minute > 59)) {
    throw new Error('Horário da previsão climática inválido.');
  }
  const minutesAfterMidnight = hour * 60 + minute;

  const blockedByHeat =
    excessiveHeat &&
    minutesAfterMidnight >= HEAT_BLOCK_START_MINUTES &&
    minutesAfterMidnight < HEAT_BLOCK_END_MINUTES;

  return {
    excessiveHeat,
    blockedByHeat,
    canWalk: !hasRain && !blockedByHeat,
  };
}
