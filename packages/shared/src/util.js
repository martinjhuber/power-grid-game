export function createMatrix(width, height, valueFunc) {
  const result = [];
  for (let x = 0; x < width; x += 1) {
    result[x] = [];
    for (let y = 0; y < height; y += 1) {
      result[x][y] = valueFunc ? valueFunc(x, y) : null;
    }
  }
  return result;
}

export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function normalizeRotation(rotation) {
  let rot = rotation % 360;
  if (rot < 0) {
    rot += 360;
  }
  return rot;
}
