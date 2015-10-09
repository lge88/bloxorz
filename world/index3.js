import { createEmitter } from '../lib/emitter';
import { createTransition } from '../lib/transition';
import { createBox } from './box';
import { EVENT_TYPES, createFloor } from './floor_';

import * as boxFallToFloor_ from './transitions/boxFallToFloor';
import * as boxRoll_ from './transitions/boxRoll';
import * as boxFallInHole_ from './transitions/boxFallInHole';
import * as boxFallOffEdge_ from './transitions/boxFallOffEdge';
import * as boxFallWithFragileTiles_ from './transitions/boxFallWithFragileTiles';

export const STATUS = {
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

function createTransition_({
  select: aSelect,
  gather: aGather,
  transition: aTransition
}) {
  let select = aSelect;
  let gather = aGather;

  if (typeof aTransition.select === 'function') {
    select = (x) => aTransition.select(aSelect(x));
  }

  if (typeof aTransition.gather === 'function') {
    gather = (state, context) => aGather(aTransition.gather(state, context), context);
  }

  return createTransition(Object.assign({}, aTransition, { select, gather }));
}

const boxFallToFloor = createTransition_({
  select: (getState) => {
    const state = getState();
    const { gridSize, box } = state;
    const { dimension, initialHeight } = box;

    return {
      dimension: {
        x: dimension.x * gridSize,
        y: dimension.y * gridSize,
        z: dimension.z * gridSize,
      },
      initialHeight,
    };
  },

  gather: (boxBodyState, context) => {
    const action = {
      type: 'UPDATE_WORLD_STATE',
      state: {
        bodies: {
          box: boxBodyState,
        },
      },
    };

    if (context.status === 'ENDED') {
      action.state.status = STATUS.STEADY;
    } else {
      action.state.status = STATUS.FALLING_TO_FLOOR;
    }

    return action;
  },

  transition: boxFallToFloor_,
});

export function createWorld({
  getState,
  dispatch,
}) {
  let handles = null;

  function bindTransition(transition) {
    const handle = transition(getState, dispatch);
    if (handles === null) { handles = []; }
    handles.push(handle);
    return handle;
  }

  function reset() {
    if (Array.isArray(handles)) {
      handles.forEach((handle) => handle.end());
    }
    handles = [];
  }

  function start() {
    const handle = bindTransition(boxFallToFloor);
    handle.start();
  }

  function pause() {

  }

  function resume() {

  }

  function roll_(direction) {
    if (status === STATUS.STEADY && ROLL_DIRECTIONS[direction] === 1) {
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

      status = STATUS.ROLLING;
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

      status = STATUS.STEADY;
    } else {
      console.assert(type === EVENT_TYPES.NOTHING);
      status = STATUS.STEADY;
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

    gstatus = STATUS.FALLING_IN_HOLE;
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

    status = STATUS.FALLING_OFF_EDGE;
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

    status = STATUS.FALLING_WITH_FRAGILE_TILES;
    handle.start();
  }

  function win() {
    status = STATUS.WON;
    emitter.emitChange();
  }

  function lose() {
    status = STATUS.LOST;
    emitter.emitChange();
  }

  reset();

  return {
    getState,
    addChangeListener: (cb) => emitter.addChangeListener(cb),
    removeChangeListener: (cb) => emitter.removeChangeListener(cb),
    clearChangeListeners: () => emitter.clearChangeListeners(),

    // commands:
    // roll,

    reset,
    start,
    pause,
    resume,
  };
}
