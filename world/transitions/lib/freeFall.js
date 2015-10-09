import { createWorld, createBox } from './cannon';

// bodies is an array of no touching objects of shape:
// {
//   key,
//   position: { x, y, z },
//   quaternion: { x, y, z, w },
//   velocity: { x, y, z },
//   angularVelocity: { x, y, z },
// }
export default function createSimulation({
  bodies,
  duration,
  onEnd,
}) {
  function getOutput(world) {
    return world.bodies.map((body) => {
      const { _key, position, quaternion } = body;
      return {
        key: _key,
        value: {
          position,
          quaternion,
        },
      };
    });
  }

  return {
    getStartState() {
      const world = createWorld({});

      bodies.forEach((body) => {
        const { key, position, quaternion } = body;
        const { velocity, angularVelocity } = body;

        const box = createBox({
          dimension: { x: 0, y: 0, z: 0 },
          position,
          quaternion,
          velocity,
          angularVelocity,
        });
        box._key = key;

        world.addBody(box);
      });

      return {
        world,
        duration,

        output: getOutput(world),
      };
    },

    getUpdatedState(state, commands) {
      const { world } = state;
      const { currentTime, previousTime } = state;
      const { startedTime, duration } = state;
      const { end } = commands;

      if (currentTime - startedTime > duration) {
        return end();
      }

      const dt = (currentTime - previousTime) / 1000;
      world.step(dt);

      return {
        output: getOutput(world),
      };
    },

    getEndState(state) {
      return state;
    },

    getAbortedState(state) {
      return state;
    },

    onEnd,
  };
}
