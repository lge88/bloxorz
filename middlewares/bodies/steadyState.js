export function updateBodiesToSteadyState(dispatch, getState) {
  const state = getState();
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
