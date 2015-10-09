import { createNormalTile } from './normal';

const FRAGILE_STRENGTH = 1.1;

export function createFragileTile({
  x, y, type, dimension,
}) {
  const tile = createNormalTile({ x, y, type, dimension });

  // When box is pressing the tile, (which will be determined by floor object).
  // h is the number of unit cubes stacked in z direction of.
  function shouldBreak({ h }) {
    return h > tile.strength;
  }

  Object.assign(tile, {
    strength: FRAGILE_STRENGTH,
    shouldBreak,
  });

  return tile;
}
