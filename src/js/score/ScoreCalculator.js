import { CONFIG } from '../config.js';

/**
 * Unified score across all grid sizes.
 *
 *   score = numTiles^sizeExponent × rotationFactor × timeFactor × modeFactor × scale
 *
 * modeFactor = wrapModeMultiplier (1) in torus mode, flatModeMultiplier (2/3) otherwise.
 * Treating wrap as 1.5× harder means equal play yields wrapScore = flatScore × 1.5.
 *
 * rotationFactor = minimumRotations / max(rotations, 1)
 * timeFactor = (numTiles × secondsPerTile) / (numTiles × secondsPerTile + timePassed)
 */
export function calculateScore(statistics, scoreConfig = CONFIG.score) {
  const { numTiles, rotations, minimumRotationsRequired, timePassed, wrap } = statistics;
  const minRot = Math.max(1, minimumRotationsRequired);
  const rot = Math.max(1, rotations);
  const rotationFactor = minRot / rot;

  const timeBaseline = numTiles * scoreConfig.secondsPerTile;
  const timeFactor = timeBaseline / (timeBaseline + Math.max(0, timePassed));

  const sizeFactor = numTiles ** scoreConfig.sizeExponent;
  const modeFactor = wrap ? scoreConfig.wrapModeMultiplier : scoreConfig.flatModeMultiplier;

  return Math.round(sizeFactor * rotationFactor * timeFactor * modeFactor * scoreConfig.scale);
}

export function formatScore(score) {
  return score.toLocaleString('en-US');
}
