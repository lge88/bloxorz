import initialState from './initialState';
import { initGame } from './game';
import { initWorld, updateWorld } from './world';

export default function reduce(state = initialState, action) {
  switch (action.type) {
  case 'LOAD_STAGE_ATTEMPT':
    return loadStageAttempt(state, action);

  case 'LOAD_STAGE_SUCCESS':
    return loadStageSuccess(state, action);

  case 'LOAD_STAGE_FAIL':
    return loadStageFail(state, action);

  case 'INIT_WORLD':
    return initWorld(state, action);

  case 'UPDATE_WORLD':
    return updateWorld(state, action);

  case 'ROLL':
    return roll(state, action);

  case 'RESIZE':
    return resize(state, action);

  default:
    return state;
  }
}

function resize(state, action) {
  const { width, height } = action;
  const viewPort = { width, height };
  return Object.assign({}, state, { viewPort });
}

function loadStageAttempt(state, action) {
  const stage = {
    loading: true,
    name: action.name,
    error: null,
  };
  return Object.assign({}, state, { stage });
}

function loadStageSuccess(state, action) {
  const { gridSize, floor } = state;
  const { dimension, initialHeight } = state.box;
  const { name, goal, tiles } = action;

  const stage = {
    loading: false,
    name: name,
    error: null,
  };

  const game = initGame({
    goal,
    tiles,
    box: {
      dimension,
    },
  });

  const world = initWorld({
    unitLength: gridSize,
    tiles: game.tiles,
    box: {
      dimension,
      initialHeight,
    },
    floor,
  });

  return Object.assign({}, state, { stage, game, world });
}

function loadStageFail(state, action) {
  const { error } = action;
  const stage = {
    loading: false,
    name: null,
    error,
  };
  return Object.assign({}, state, { stage });
}
