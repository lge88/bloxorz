import { createNormalTile } from './normal';

export function createGateTile({
  x, y, type, dimension,
  axis,
  enabled,
  singleUse,
}) {
  const tile = createNormalTile({ x, y, type, dimension });

  // TODO: figure out _axis, pivot vector3 from axis enum:
  // {Left,Right,Forward,Backward}
  let _axis;
  let pivot;



  // TODO: returns a new tile instead?
  function toggle() {
    tile.enabled = !(tile.enabled);
  }

  Object.assign(tile, {
    axis: _axis,
    pivot: pivot,
    singleUse,
    enabled,

    // commands:
    toggle,
  });

  return tile;
}
