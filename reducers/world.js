import { getSteadyBoxBodyState } from './box';

export function initWorld({
  unitLength,
  tiles,
  box,
  tile,
}) {
  let bodies = [];

  bodies.push({
    key: 'box_0',
    type: 'Box',
    index: 0,
    debug: box.debug,
    scale: {
      x: unitLength * box.dimension.x,
      y: unitLength * box.dimension.y,
      z: unitLength * box.dimension.z,
    },
    position: { x: 0, y: 0, z: box.initialHeight },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
  });

  const { width, thickness } = tile;
  Object.keys(tiles).forEach((key) => {
    const tile = tiles[key];
    const x = unitLength * tile.x;
    const y = unitLength * tile.y;
    const z = -0.5 * unitLength * thickness;

    const body = {
      key: tile.key,
      type: tile.type,
      scale: {
        x: unitLength * width,
        y: unitLength * width,
        z: unitLength * thickness,
      },
      position: { x, y, z },
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
    };

    bodies.push(body);
  });

  bodies = bodies.reduce((dict, body) => {
    dict[body.key] = body;
    return dict;
  }, {});

  return { bodies };
}

export function updateBodies(state, action) {
  const { bodies } = action;
  const oldBodies = state.world.bodies;

  const newBodies = Object.assign({}, oldBodies);
  Object.keys(bodies).forEach((key) => {
    newBodies[key] = Object.assign({}, oldBodies[key], bodies[key]);
  });

  const world = { bodies: newBodies };
  return Object.assign({}, state, { world });
}

export function updateBodiesToSteadyState(state) {
  const game = state.game;
  const unitLength = state.gridSize;
  const oldBodies = state.world.bodies;
  const newBodies = Object.assign({}, oldBodies);

  Object.keys(newBodies).forEach((key) => {
    const body = newBodies[key];
    // Update box to steady state;
    if (body.type === 'Box') {
      const box = game.boxes[body.index];
      updateBoxBodyToSteadyState(body, box, unitLength);
    } else if (body.type === 'Gate') {
      updateGateToSteadyState(body, game);
    }
  });

  // Update gates to steady state;

  const world = { bodies: newBodies };
  return Object.assign({}, state, { world });
}

function updateBoxBodyToSteadyState(body, box, unitLength) {
  const { position, quaternion } = getSteadyBoxBodyState(box, unitLength);
  Object.assign(body, { position, quaternion });
}
