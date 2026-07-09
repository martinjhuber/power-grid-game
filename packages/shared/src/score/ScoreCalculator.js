import { SCORE_CONFIG } from '../config.js';

/**
 * Legacy rational score formula with under-par cap and mode/size adjustments.
 */
export function calculateScore(statistics, scoreConfig = SCORE_CONFIG) {
  const { numTiles, rotations, minimumRotationsRequired, timePassed, wrap } = statistics;
  const par = Math.max(1, minimumRotationsRequired);
  const effectiveRotations = Math.max(rotations, par);
  const time = Math.max(1, timePassed);

  const overParSteps = effectiveRotations - par + 1;
  const numerator = par * overParSteps + time;
  const denominator = 2 * time * overParSteps;

  const sizeFactor = numTiles ** scoreConfig.sizeExponent;
  const modeFactor = wrap ? scoreConfig.wrapModeMultiplier : scoreConfig.flatModeMultiplier;

  return Math.round(
    scoreConfig.scale * sizeFactor * (numerator / denominator) * modeFactor,
  );
}

export function formatScore(score) {
  return score.toLocaleString('en-US');
}
