import { CONFIG } from '../config.js';

/**
 * Unified score across all grid sizes.
 *
 *   score = numTiles^sizeExponent × rotationFactor × timeFactor × scale
 *
 * sizeExponent = 2 rewards larger grids disproportionately so a 13×13 run
 * outscores smaller boards even with more absolute rotations.
 *
 * rotationFactor = minimumRotations / max(rotations, 1)
 * timeFactor = (numTiles × secondsPerTile) / (numTiles × secondsPerTile + timePassed)
 *
 * Calibrated so a solid 13×13 finish lands around 1.0–1.2 M (low seven digits),
 * while seven digits stay rare overall — smaller grids and mediocre 13×13 runs
 * remain in the six-digit range.
 */
export function calculateScore(statistics, scoreConfig = CONFIG.score) {
  const { numTiles, rotations, minimumRotationsRequired, timePassed } = statistics;
  const minRot = Math.max(1, minimumRotationsRequired);
  const rot = Math.max(1, rotations);
  const rotationFactor = minRot / rot;

  const timeBaseline = numTiles * scoreConfig.secondsPerTile;
  const timeFactor = timeBaseline / (timeBaseline + Math.max(0, timePassed));

  const sizeFactor = numTiles ** scoreConfig.sizeExponent;

  return Math.round(sizeFactor * rotationFactor * timeFactor * scoreConfig.scale);
}

export function formatScore(score) {
  return score.toLocaleString('de-DE');
}
