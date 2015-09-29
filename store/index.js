import level0 from '../stages/level-0.json';
import loop from '../lib/loop';
import { createWorld } from './world';

let state = {
  goal: level0.goal,

  gridSize: 0.1,

  box: {
    debug: false,
    dimension: { x: 1, y: 1, z: 2 },
    position: { x: 0, y: 0, z: 1.2 },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
  },

  floor: {
    thickness: 0.03,
    tiles: level0.tiles,
  },

  lights: {
    intensity: 1.0,
  },

  camera: {
    position: { x: 2, y: -5, z: 5 },
  },

  width: window.innerWidth,
  height: window.innerHeight,

  paused: false,
};

const listeners = [];

const world = createWorld({
  goal: state.goal,
  gridSize: state.gridSize,
  boxOptions: {
    nx: state.box.dimension.x,
    ny: state.box.dimension.y,
    nz: state.box.dimension.z,
    initialHeight: state.box.position.z,
  },
  tiles: state.floor.tiles,
});

function updateWorld() {
  world.update();
  const { position, quaternion } = world.getBoxBodyState();
  Object.assign(state.box.position, position);
  Object.assign(state.box.quaternion, quaternion);
  emitChange();
}

const handle = loop.add(updateWorld);

export function getState() {
  return state;
}

export function addChangeListener(cb) {
  listeners.push(cb);
}

export function removeChangeListener(cb) {
  const i = listeners.indexOf(cb);
  if (i > -1) listeners.splice(i, 1);
}

export function emitChange() {
  listeners.forEach((cb) => { cb(); });
}

export function dispatch(action) {
  const type = action.type;
  switch (type) {
  case 'ROLL':
    world.roll(action.direction);
    break;
  case 'RESIZE':
    const { width, height } = action;
    Object.assign(state, { width, height });
    emitChange();
    break;
  case 'PAUSE':
    handle.enabled = false;
    state.paused = true;
    emitChange();
    break;
  case 'RESUME':
    handle.enabled = true;
    state.paused = false;
    emitChange();
    break;
  case 'TOGGLE_PAUSE_RESUME':
    handle.enabled = !(handle.enabled);
    state.paused = !(state.paused);
    emitChange();
    break;
  default:
    throw new Error(`Unknown action type ${type}.`);
  }
}
