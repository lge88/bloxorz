import loop from '../lib/loop';
import stages from '../stages';
import { createEmitter } from '../lib/emitter';
import { createWorld as createWorld_ } from '../world';

let state = {
  gridSize: 0.1,

  box: {
    debug: false,
    dimension: { x: 1, y: 1, z: 2 },
    initialHeight: 1.2,
  },

  floor: {
    thickness: 0.015,
  },

  lights: {
    intensity: 1.0,
  },

  camera: {
    aabbScale: { x: 1.2, y: 1.2, z: 3.0 },
    direction: { x: -1, y: -5, z: 3 },
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


let world = null;
let handle = null;
function createWorld(state) {
  const { gridSize, box, floor } = state;
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
    floorOptions: {
      thickness: floor.thickness,
    },
  });

  function updateWorld() {
    world.update();

    const worldState = world.getState();

    dispatch({
      type: 'UPDATE_WORLD_STATE',
      state: worldState,
    });

    const currentStage = state.world.stage.name;
    if (worldState.state === 'WON') {
      handle.remove();
      dispatch({ type: 'PAUSE' });
      alert('You win!');
      const nextStage = stages.getNextStage(currentStage);
      dispatch({ type: 'LOAD_STAGE', name: nextStage });
    } else if (worldState.state === 'LOST') {
      handle.remove();
      dispatch({ type: 'PAUSE' });
      alert('You lost!');
      dispatch({ type: 'LOAD_STAGE', name: currentStage });
    }
  }

  handle = loop.add(updateWorld);

  return [ world, handle ];
}

function loadStage(name) {
  const stage = stages.findByName(name);
  const url = (stage && stage.url) || null;
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
      state.paused = false;
      [ world, handle ] = createWorld(state);
    })
    .catch((err) => {
      console.log(`${err}`);
    });
}

export function getState() {
  return state;
}

const emitter = createEmitter();

export function addChangeListener(cb) {
  emitter.addChangeListener(cb);
}

export function removeChangeListener(cb) {
  emitter.removeChangeListener(cb);
}

export function emitChange() {
  emitter.emitChange();
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
