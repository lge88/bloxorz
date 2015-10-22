const FRAGILE_STRENGTH = 1.1;

export function init(aTile) {
  const tile = Object.assign({ strength: FRAGILE_STRENGTH }, aTile);
  return tile;
}

export function shouldBreak(tile, h) {
  return h > tile.strength;
}
