export function initWorld({
  unitLength,
  tiles,
  box,
  floor,
}) {
  const bodies = {
    box: {
      position: { x: 0, y: 0, z: box.initialHeight },
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
    },
    tiles: {},
  };

  Object.keys(tiles).forEach((key) => {
    const tile = tiles[key];
    const x = unitLength * tile.x;
    const y = unitLength * tile.y;
    const z = -0.5 * floor.thickness;

    bodies.tiles[tile.key] = {
      type: tile.type,
      position: { x, y, z },
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
    };
  });
  return { bodies };
}

export function updateWorld(state, action) {
  const { bodies } = action;
  const box = Object.assign({}, state.world.bodies.box, bodies.box);
  const tiles = Object.assign({}, state.world.bodies.tiles, bodies.tiles);
  const world = { bodies: { box, tiles } };
  return Object.assign({}, state, { world });
}
