import { createTilesLUT } from './tiles';
import { roll as roll_, initBoxState } from './box';

export function initGame({ unitLength, goal, box, tiles } ) {
  const tilesLUT = createTilesLUT(tiles);
  const { dimension } = box;
  const offset = {
    x: [ 0, 0, 0 ],
    y: [ 0, 0, 0 ],
  };
  const orientation = {
    x: 'FORWARD',
    y: 'LEFT',
  };

  const box0 = initBoxState({ unitLength, dimension, offset, orientation });

  const gameState = {
    goal,
    status: null,
    tiles: tilesLUT,
    activeBoxIndex: 0,
    boxes: [
      box0,
    ],
  };

  console.log('box0', box0);

  return check(gameState);
}

// Returns newGameState
function getStatus(game) {
  return { type: 'VALID' };

  [ willHappen, data ] = checkFallInHole(block);
  if (willHappen) { return data; }

  [ willHappen, data ] = checkFallOffEdge(block);
  if (willHappen) { return data; }

  [ willHappen, data ] = checkBreakFragileTiles(block);
  if (willHappen) { return data; }

  [ willHappen, data ] = checkTriggerSwitch(block);
  if (willHappen) { return data; }

  return { type: 'VALID' };
}

function check(game) {
  const newGame = Object.assign({}, game);
  newGame.status = getStatus(game);
  return newGame;
}

export function roll(state, action) {
  const { direction } = action;

  const game = state.game;
  const box = game.boxes[game.activeBoxIndex];
  const nextBox = roll_(box, direction);

  const boxes = game.boxes.slice();
  boxes[game.activeBoxIndex] = nextBox;

  let newGame = Object.assign({}, game, { boxes });
  newGame = check(newGame);

  return Object.assign({}, state, { game: newGame });
}
