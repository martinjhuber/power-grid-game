import { CONFIG } from '../config.js';

/**
 * Legacy rational score formula with under-par cap and mode/size adjustments.
 *
 *   d = max(rotations, par) − par + 1        (always ≥ 1, no bonus under par)
 *   score = scale × numTiles^sizeExponent × (par × d + time) / (2 × time × d) × modeFactor
 *
 * modeFactor = wrapModeMultiplier (1) in torus mode, flatModeMultiplier (2/3) otherwise.
 * sizeExponent > 1 weights larger boards above the original linear tile count.
 */
export function calculateScore(statistics, scoreConfig = CONFIG.score) {
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
