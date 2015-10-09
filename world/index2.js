import { createEmitter } from '../lib/emitter';
import { createSimulator } from './simulator';
import { createBox } from './box';
import { EVENT_TYPES, createFloor } from './floor_';

import boxFallToFloor from './simulations/boxFallToFloor';
import boxRoll from './simulations/boxRoll';
import boxFallInHole from './simulations/boxFallInHole';
import boxFallOffEdge from './simulations/boxFallOffEdge';
import boxFallWithFragileTiles from './simulations/boxFallWithFragileTiles';

export const STATE = {
  INIT: 'INIT',
  FALLING_TO_FLOOR: 'FALLING_TO_FLOOR',
  STEADY: 'STEADY',
  ROLLING: 'ROLLING',
  FALLING_IN_HOLE: 'FALLING_IN_HOLE',
  FALLING_OFF_EDGE: 'FALLING_OFF_EDGE',
  FALLING_WITH_FRAGILE_TILES: 'FALLING_WITH_FRAGILE_TILES',
  WON: 'WON',
  LOST: 'LOST',
};

export const ROLL_DIRECTIONS = {
  LEFT: 1,
  RIGHT: 1,
  FORWARD: 1,
  BACKWARD: 1,
};

export function createWorld({
  goal,
  tiles,
  unitLength,
  boxOptions,
  // floorOptions,
}) {
  let emitter = null;
  let simulator = null;
  let started = null;
  let box = null;
  let floor = null;
  let state = null;

  function reset() {
    // TODO: Check and undestruture params.
    // TODO: Initialize floor, box.
    // TODO: set initial state of simulator.
    const { nx, ny, nz } = boxOptions;

    emitter = createEmitter();

    simulator = createSimulator();
    simulator.addChangeListener(emitter.emitChange);

    started = false;

    box = createBox({
      unitLength,
      dimension: [ nx, ny, nz ],
      offset: { x: [ 0, 0, 0 ], y: [ 0, 0, 0 ] },
      orientation: { x: 'FORWARD', y: 'LEFT' },
    });

    floor = createFloor({
      goal,
      unitLength,
      tiles,
    });

    simulator._setState({
      box: box.steadyBodyState
    });

    state = STATE.INIT;
  }

  function start() {
    if (started === true) return;

    const { nx, ny, nz } = boxOptions;
    const dimension = {
      x: nx * unitLength,
      y: ny * unitLength,
      z: nz * unitLength
    };
    const initialHeight = boxOptions.position.z;
    const endBodyState = box.steadyBodyState;
    const onEnd = () => { state = STATE.STEADY; };

    const simulation = boxFallToFloor({
      dimension,
      initialHeight,
      endBodyState,
      onEnd,
    });
    const handle = simulator.createSimulation(simulation);

    started = true;
    state = STATE.FALLING_TO_FLOOR;
    handle.start();
  }

  function pause() {

  }

  function resume() {

  }

  function getState() {
    const bodies = simulator.getState();
    console.log(state);
    return {
      state,
      bodies,
    };
  }

  function roll(direction) {
    if (state === STATE.STEADY && ROLL_DIRECTIONS[direction] === 1) {
      const { axis, pivot, nextBox } = box.roll(direction);
      const { position, quaternion } = box.steadyBodyState;

      const onEnd = onRollEnd.bind(null, nextBox);
      const simulation = boxRoll({
        position,
        quaternion,
        axis,
        pivot,
        onEnd,
      });

      const handle = simulator.createSimulation(simulation);

      state = STATE.ROLLING;
      handle.start();
    }
  }

  function onRollEnd(nextBox) {
    box = nextBox;

    const eventData = floor.check(nextBox.blockUnder);
    const { type } = eventData;
    console.log(eventData.type);

    if (type === EVENT_TYPES.FALL_IN_HOLE) {
      fallInHole();
    } else if (type === EVENT_TYPES.FALL_OFF_EDGE) {
      const tilesUnderBox = eventData.solidTilesWithinBlock;
      fallOffEdge(tilesUnderBox);
    } else if (type === EVENT_TYPES.BREAK_FRAGILE_TILES) {
      const fragileTiles = eventData.fragileTiles;
      fallWithFragileTiles(fragileTiles);
    } else if (type === EVENT_TYPES.TRIGGER_SWITCHES) {

      state = STATE.STEADY;
    } else {
      console.assert(type === EVENT_TYPES.NOTHING);
      state = STATE.STEADY;
    }

    emitter.emitChange();
  }

  function fallInHole() {
    const { position, quaternion } = box.steadyBodyState;
    const onEnd = win;

    const simulation = boxFallInHole({
      position,
      quaternion,
      onEnd,
    });

    const handle = simulator.createSimulation(simulation);

    state = STATE.FALLING_IN_HOLE;
    handle.start();
  }

  function fallOffEdge(tilesUnderBox) {
    const { nx, ny, nz } = boxOptions;
    const dimension = { x: nx * unitLength, y: ny * unitLength, z: nz * unitLength };
    const { position, quaternion } = box.steadyBodyState;
    const onEnd = lose;

    const simulation = boxFallOffEdge({
      dimension,
      position,
      quaternion,
      tilesUnderBox,
      onEnd,
    });

    const handle = simulator.createSimulation(simulation);

    state = STATE.FALLING_OFF_EDGE;
    handle.start();
  }

  function fallWithFragileTiles(fragileTiles) {
    const { position, quaternion } = box.steadyBodyState;
    const onEnd = lose;

    const simulation = boxFallWithFragileTiles({
      position,
      quaternion,
      fragileTiles,
      onEnd,
    });

    const handle = simulator.createSimulation(simulation);

    state = STATE.FALLING_WITH_FRAGILE_TILES;
    handle.start();
  }

  function win() {
    state = STATE.WON;
    emitter.emitChange();
  }

  function lose() {
    state = STATE.LOST;
    emitter.emitChange();
  }

  reset();

  return {
    getState,
    addChangeListener: (cb) => emitter.addChangeListener(cb),
    removeChangeListener: (cb) => emitter.removeChangeListener(cb),
    clearChangeListeners: () => emitter.clearChangeListeners(),

    // commands:
    roll,

    reset,
    start,
    pause,
    resume,
  };
}
