import { createEmitter } from '../lib/emitter';
import { createSimulator } from './simulator';
import { createBox } from './box';
import { createFloor } from './floor_';

import boxFallToFloor from './simulations/boxFallToFloor';

export const STATE = {
  INIT: 'INIT',
  FALLING_TO_FLOOR: 'FALLING_TO_FLOOR',
  STEADY: 'STEADY',
  ROLLING: 'ROLLING',
  ROLLED: 'ROLLED',
  FALLING_IN_HOLE: 'FALLING_IN_HOLE',
  FALLING_OFF_EDGE: 'FALLING_OFF_EDGE',
  FALLING_WITH_FRAGILE_TILE: 'FALLING_WITH_FRAGILE_TILE',
  WON: 'WON',
  LOST: 'LOST',
};

export const CONTROL_STATE = {
  NOOP: 'NOOP',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  FORWARD: 'FORWARD',
  BACKWARD: 'BACKWARD',
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
  let controlState = null;

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
    controlState = CONTROL_STATE.NOOP;
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
    /* console.log('bodies', bodies); */
    console.log('state', state);

    return {
      state,
      controlState,
      bodies,
    };
  }

  function roll() {
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
