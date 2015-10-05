import loop from '../lib/loop';
import stages from '../stages';
import { createWorld as createWorld_ } from '../world';

let state = {
  gridSize: 0.1,

  box: {
    debug: false,
    dimension: { x: 1, y: 1, z: 2 },
    initialHeight: 1.2,
  },

  floor: {
    thickness: 0.03,
  },

  lights: {
    intensity: 1.0,
  },

  camera: {
    position: { x: 2, y: -5, z: 5 },
  },

  viewPort: {
    width: window.innerWidth,
    height: window.innerHeight,
  },

  paused: false,

  // States updated every frame:
  world: {
    // Setup when load:
    stage: {
      name: null,
      url: null,
    },
    goal: null,
    tiles: [],

    // Updated every frame:
    state: null,
    bodies: {
      box: {
        position: {},
        // position: { x: 0, y: 0, z: 1.2 },
        quaternion: {},
        // quaternion: { x: 0, y: 0, z: 0, w: 1 },
      },
    },
  },

};

const listeners = [];

let world = null;
let handle = null;
function createWorld(state) {
  const { gridSize, box } = state;
  const { goal, tiles } = state.world;
  const { dimension, initialHeight } = box;

  world = createWorld_({
    goal,
    gridSize,
    tiles: tiles,
    boxOptions: {
      nx: dimension.x,
      ny: dimension.y,
      nz: dimension.z,
      position: { x: 0, y: 0, z: initialHeight },
    },
  });

  function updateWorld() {
    world.update();

    const worldState = world.getState();

    dispatch({
      type: 'UPDATE_WORLD_STATE',
      state: worldState,
    });

    if (worldState.state === 'WON') {
      handle.remove();
      alert('You win!');
      dispatch({ type: 'PAUSE' });
    } else if (worldState.state === 'LOST') {
      handle.remove();
      alert('You lost!');
      dispatch({ type: 'PAUSE' });
    }
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
      const { name, goal, tiles } = stage;
      // clear current stage;
      if (handle) {
        handle.remove();
        handle = null;
      }

      Object.assign(state.world.stage, { url, name });
      Object.assign(state.world, { goal, tiles });
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
    Object.assign(state.viewPort, { width, height });
    emitChange();
    break;

  case 'PAUSE':
    if (handle !== null) { handle.enabled = false; }
    state.paused = true;
    emitChange();
    break;

  case 'RESUME':
    if (handle !== null) { handle.enabled = true; }
    state.paused = false;
    emitChange();
    break;

  case 'TOGGLE_PAUSE_RESUME':
    if (state.paused) {
      dispatch({ type: 'RESUME' });
    } else {
      dispatch({ type: 'PAUSE' });
    }
    break;

  case 'UPDATE_WORLD_STATE':
    Object.assign(state.world, action.state);
    emitChange();
    break;

  default:
    throw new Error(`Unknown action type ${type}.`);
  }
}
