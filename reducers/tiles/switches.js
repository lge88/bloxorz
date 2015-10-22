const ROUND_SWITCH_STRENGTH = 0.9;
const CROSS_SWITCH_STRENGTH = 1.9;

export function init(aTile) {
  const type = aTile.type;

  let strength;
  if (type === 'RoundSwitch') {
    strength = ROUND_SWITCH_STRENGTH;
  } else if (type === 'CROSS_SWITCH_STRENGTH') {
    strength = CROSS_SWITCH_STRENGTH;
  } else {
    strength = Infinity;
  }

  const tile = Object.assign({
    singleUse: false,
    alreadyUsed: false,
    gates: [],
    strength,
  }, aTile);

  return tile;
}

export function shouldTrigger(tile, h) {
  if (tile.singleUse && tile.alreadyUsed) return false;
  return h > tile.strength;
}

export function trigger(tile) {
  tile.alreadyUsed = true;
}
