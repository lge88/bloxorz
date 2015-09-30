import loop from '../lib/loop';
import stages from '../stages';
import { createWorld as createWorld_ } from '../world';

let state = {
  stage: {
    name: null,
    displayName: null,
    start: null,
    goal: null,
  },

  gridSize: 0.1,

  box: {
    debug: false,
    dimension: { x: 1, y: 1, z: 2 },
    position: { x: 0, y: 0, z: 1.2 },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
  },

  floor: {
    thickness: 0.03,
    tiles: [],
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

let world = null;
let handle = {};
function createWorld(state) {
  const { stage, gridSize, box, floor } = state;
  const { goal } = stage;
  const { dimension, position } = box;
  const { tiles } = floor;

  world = createWorld_({
    goal,
    gridSize,
    tiles: tiles,
    boxOptions: {
      nx: dimension.x,
      ny: dimension.y,
      nz: dimension.z,
      position: position,
    },
  });

  function updateWorld() {
    world.update();
    const { position, quaternion } = world.getBoxBodyState();
    Object.assign(state.box.position, position);
    Object.assign(state.box.quaternion, quaternion);
    emitChange();
  }

  handle = loop.add(updateWorld);

  return [ world, handle ];
}

function loadStage(level) {
  const url = stages[level];
  fetch(url)
    .then((res) => {
      return res.json();
    })
    .then((stage) => {
      const { name, start, goal } = stage;
      Object.assign(state.stage, { name, start, goal });

      state.floor.tiles = stage.tiles;
      state.box.position.x = stage.start.x * state.gridSize;
      state.box.position.y = stage.start.y * state.gridSize;

      [ world, handle ] = createWorld(state);
    })
    .catch((err) => {
      console.log(`${err}`);
    });
}

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

  case 'LOAD_STAGE':
    loadStage(action.name);
    break;

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
