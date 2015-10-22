export function init(aTile) {
  const tile = Object.assign({
    enabled: false,
    hinge: 'LEFT',
  }, aTile);
  return tile;
}

export function toggle(tile) {
  tile.enabled = !(tile.enabled);
}
