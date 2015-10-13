import { createWorld, createBox, createGround } from './lib/cannon';
const { abs } = Math;

const MAX_DURATION = 2000;
const THRESHOLD = 0.01;

function isDone(state, context) {
  const { box, endBodyState } = state;
  const { timestamps } = context;
  const { currentTime, startTime } = timestamps;

  if (currentTime - startTime > MAX_DURATION) {
    return true;
  }

  const targetZ = endBodyState.position.z;
  const err = abs((box.position.z - targetZ) / targetZ);
  return err < THRESHOLD &&
    box.velocity.length() < THRESHOLD &&
    box.angularVelocity.length() < THRESHOLD;
}

export function gather({ bodyState }) {
  return bodyState;
}

export function getStartState({
  dimension,
  initialHeight,
}) {
  const world = createWorld({
    gravity: { x: 0, y: 0, z: -20 },
  });

  const box = createBox({
    dimension,
    position: { x: 0, y: 0, z: initialHeight },
    material: { friction: 1.0, restitution: 0.4 },
  });

  const endBodyState = {
    position: { x: 0, y: 0, z: 0.5 * dimension.z },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
  };

  const ground = createGround({});

  world.addBody(box);
  world.addBody(ground);

  const { position, quaternion } = box;
  const bodyState = { position, quaternion };

  return {
    dimension,
    initialHeight,
    endBodyState,
    world,
    box,

    // output:
    bodyState,
  };
}

const dt = 1 / 60;
export function getRunningState(state, context) {
  if (isDone(state, context)) {
    return context.END;
  }

  const { world, box } = state;
  world.step(dt);

  const { position, quaternion } = box;
  const bodyState = { position, quaternion };

  return Object.assign({}, state, { bodyState });
}

export function getEndState({ endBodyState }) {
  return { bodyState: endBodyState };
}

export const getCancelState = getEndState;
