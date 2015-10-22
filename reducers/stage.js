import { initGame } from './game';
import { initWorld } from './world';

export function loadStageAttempt(state, action) {
  const stage = {
    loading: true,
    name: action.name,
    error: null,
  };
  return Object.assign({}, state, { stage });
}

export function loadStageSuccess(state, action) {
  const { gridSize, tile, box } = state;
  const { name, goal, tiles } = action;

  const stage = {
    loading: false,
    name: name,
    error: null,
  };

  const game = initGame({
    unitLength: gridSize,
    goal,
    tiles,
    box: {
      dimension: box.dimension,
    },
  });

  const world = initWorld({
    unitLength: gridSize,
    tiles: game.tiles,
    tile,
    box,
  });

  return Object.assign({}, state, { stage, game, world });
}

export function loadStageFail(state, action) {
  const { error } = action;
  const stage = {
    loading: false,
    name: null,
    error,
  };
  return Object.assign({}, state, { stage });
}
