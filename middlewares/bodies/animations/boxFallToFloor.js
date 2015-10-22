import { createWorld, createBox, createGround } from '../lib/cannon';
const { abs } = Math;

const MAX_DURATION = 2000;
const THRESHOLD = 0.01;
const DT = 1 / 60;

export default function createFrameFunc(dispatch, getState, end) {
  const state = getState();
  const oldBoxBody = state.world.bodies.box_0;

  const world = createWorld({
    gravity: { x: 0, y: 0, z: -20 },
  });

  const box = createBox({
    dimension: oldBoxBody.scale,
    position: oldBoxBody.position,
    material: { friction: 1.0, restitution: 0.4 },
  });

  const ground = createGround({});

  world.addBody(box);
  world.addBody(ground);

  const endBodyState = {
    position: { x: 0, y: 0, z: 0.5 * oldBoxBody.scale.z },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
  };

  function isSteady() {
    const targetZ = endBodyState.position.z;
    const err = abs((box.position.z - targetZ) / targetZ);
    return err < THRESHOLD &&
      box.velocity.length() < THRESHOLD &&
      box.angularVelocity.length() < THRESHOLD;
  }

  function emit({ position, quaternion }) {
    dispatch({
      type: 'UPDATE_BODIES',
      bodies: {
        box_0: { position, quaternion },
      }
    });
  }

  return function(currentTime, startTime) {
    if (isSteady() || currentTime - startTime > MAX_DURATION) {
      emit(endBodyState);
      return end();
    }

    world.step(DT);
    emit(box);
  };
}
