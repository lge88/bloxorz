import { createWorld, createBox, createGround } from './lib/cannon';
const { abs } = Math;

// FIXME: sometime the box would not stand after fall:(
export default function createSimulation({
  dimension,
  initialHeight,
  endBodyState,
  onEnd,
}) {
  function createContext() {
    const world = createWorld({
      gravity: { x: 0, y: 0, z: -20 },
    });
    const box = createBox({
      dimension,
      position: { x: 0, y: 0, z: initialHeight },
      material: { friction: 1.0, restitution: 0.0 },
    });
    const ground = createGround({});
    world.addBody(box);
    world.addBody(ground);
    return { world, box, ground };
  }

  function isDone(box, dimension) {
    const threshold = 1 / 100;
    const targetZ = 0.5 * dimension.z;
    const err = abs((box.position.z - targetZ) / targetZ);
    return err < threshold &&
      box.velocity.length() < threshold &&
      box.angularVelocity.length() < threshold;
  }

  return {
    getStartState() {
      const key = 'box';
      const { world, box } = createContext();
      const { position, quaternion } = box;
      const bodyState = { position, quaternion };

      return {
        key,
        initialHeight,
        dimension,
        world,
        box,
        endBodyState,

        output: [
          { key, value: bodyState },
        ],
      };
    },

    getUpdatedState(state, commands) {
      const { world, box, dimension } = state;
      const { currentTime, previousTime } = state;
      const { key } = state;
      const { end } = commands;

      const dt = (currentTime - previousTime) / 1000;
      world.step(dt);

      const { position, quaternion } = box;
      const bodyState = { position, quaternion };

      if (isDone(box, dimension) ||
          currentTime - state.startedTime > 2000) {
        return end();
      }

      return {
        output: [
          { key, value: bodyState },
        ],
      };
    },

    getEndState(state) {
      const { key, endBodyState } = state;

      return {
        output: [
          { key, value: endBodyState },
        ],
      };
    },

    getAbortedState(state) {
      const { key, endBodyState } = state;

      return {
        output: [
          { key, value: endBodyState },
        ],
      };
    },

    onEnd,
  };
}