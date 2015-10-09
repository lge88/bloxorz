import { createWorld, createBox } from './lib/cannon';

const DURATION = 500;
const SHRINK = 0.9;

export default function createSimulation({
  dimension,
  position,
  quaternion,
  tilesUnderBox,
  onEnd,
}) {
  function createContext() {
    const world = createWorld({});
    const box = createBox({
      dimension,
      position,
      quaternion,
    });

    tilesUnderBox.forEach((tile) => {
      const { x, y, dimension } = tile;
      const position = {
        x: x * dimension.x,
        y: y * dimension.y,
        z: -0.5 * dimension.z,
      };

      const shrinkedDimension = {
        x: SHRINK * dimension.x,
        y: SHRINK * dimension.y,
        z: SHRINK * dimension.z,
      };

      const body = createBox({
        dimension: shrinkedDimension,
        position,
        mass: 0,
      });

      world.addBody(body);
    });

    world.addBody(box);

    return { world, box };
  }

  return {
    getStartState() {
      const key = 'box';
      const { world, box } = createContext();
      const { position, quaternion } = box;
      const bodyState = { position, quaternion };

      return {
        key,
        world,
        box,
        duration: DURATION,
        output: [
          { key, value: bodyState },
        ],
      };
    },

    getUpdatedState(state, commands) {
      const { world, box } = state;
      const { key } = state;
      const { currentTime, previousTime } = state;
      const { duration, startedTime } = state;
      const { end } = commands;

      if (currentTime - startedTime >= duration) {
        return end();
      }

      const dt = (currentTime - previousTime) / 1000;
      world.step(dt);

      const { position, quaternion } = box;
      const bodyState = { position, quaternion };

      return {
        output: [
          { key, value: bodyState },
        ],
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
