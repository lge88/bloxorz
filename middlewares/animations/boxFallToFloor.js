import { createWorld, createBox, createGround } from './lib/cannon';
const { abs } = Math;

const MAX_DURATION = 2000;
const THRESHOLD = 0.01;

export default function createFrameFunc(dispatch, getState, end) {
  const state = getState();
  const { dimension, initialHeight } = state.box;
  const { gridSize } = state;

  const world = createWorld({
    gravity: { x: 0, y: 0, z: -20 },
  });

  const box = createBox({
    dimension: {
      x: dimension.x * gridSize,
      y: dimension.y * gridSize,
      z: dimension.z * gridSize,
    },
    position: { x: 0, y: 0, z: initialHeight },
    material: { friction: 1.0, restitution: 0.4 },
  });

  const ground = createGround({});

  world.addBody(box);
  world.addBody(ground);

  const endBodyState = {
    position: { x: 0, y: 0, z: 0.5 * dimension.z * gridSize },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
  };

  function isSteady() {
    const targetZ = endBodyState.position.z;
    const err = abs((box.position.z - targetZ) / targetZ);
    return err < THRESHOLD &&
      box.velocity.length() < THRESHOLD &&
      box.angularVelocity.length() < THRESHOLD;
  }

  const dt = 1 / 60;
  return function(currentTime, startTime) {
    if (isSteady() || currentTime - startTime > MAX_DURATION) {
      dispatch({
        type: 'UPDATE_WORLD',
        bodies: {
          box: endBodyState,
        }
      });
      return end();
    }

    world.step(dt);

    dispatch({
      type: 'UPDATE_WORLD',
      bodies: {
        box,
      }
    });
  };
}
