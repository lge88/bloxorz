import { createNormalTile } from './normal';
const ROUND_SWITCH_STRENGTH = 0.9;
const CROSS_SWITCH_STRENGTH = 1.9;

function createSwitchTile({
  x, y, type, dimension,
  singleUse,
  gates,
  strength,
}) {
  const tile = createNormalTile({ x, y, type, dimension });

  Object.assign(tile, {
    singleUse,
    gates,
    strength,
    alreadyTriggered: false,
  });

  // When box is pressing the tile, (which will be determined by floor object).
  // h is the number of unit cubes stacked in z direction of.
  function shouldTrigger({ h }) {
    if (tile.singleUse && tile.alreadyTriggered) return false;
    return h > tile.strength;
  }

  function trigger() {
    tile.alreadyTriggered = true;
  }

  Object.assign(tile, {
    shouldTrigger,
    trigger,
  });

  return tile;
}

export function createRoundSwitchTile({
  x, y, type, dimension,
  gates,
  singleUse,
}) {
  return createSwitchTile({
    x, y, type, dimension,
    gates,
    singleUse,
    strength: ROUND_SWITCH_STRENGTH,
  });
}

export function createCrossSwitchTile({
  x, y, type, dimension,
  gates,
  singleUse,
}) {
  return createSwitchTile({
    x, y, type, dimension,
    gates,
    singleUse,
    strength: CROSS_SWITCH_STRENGTH,
  });
}
