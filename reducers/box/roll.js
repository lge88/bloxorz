import { createDice } from './dice';

// Returns newBox
// pivot and axis is in world frame.
export default function roll({
  offset,
  orientation,
}, direction) {
  const dice = createDice({ orientation });
  const { newDice } = dice.roll(direction);

  function getNextOffset() {
    let xOrY;
    let increment;
    if (direction === 'FORWARD') {
      [ xOrY, increment ] = [ 'x', 1 ];
    } else if (direction === 'BACKWARD') {
      [ xOrY, increment ] = [ 'x', -1 ];
    } else if (direction === 'LEFT') {
      [ xOrY, increment ] = [ 'y', 1 ];
    } else if (direction === 'RIGHT') {
      [ xOrY, increment ] = [ 'y', -1 ];
    } else {
      throw new Error(`Invalid direction ${direction}.`);
    }

    let nextOffset = {
      x: [ ...offset.x ],
      y: [ ...offset.y ],
    };

    ['UP', direction].forEach((dir) => {
      const local = dice.globalToLocal(dir);
      let dim;
      if (local === 'FORWARD' || local === 'BACKWARD') {
        dim = 0;
      } else if (local === 'LEFT' || local === 'RIGHT') {
        dim = 1;
      } else if (local === 'UP' || local === 'DOWN') {
        dim = 2;
      } else {
        throw new Error(`Invalid local orientation. ${local}`);
      }
      nextOffset[xOrY][dim] += increment;
    });

    return nextOffset;
  }

  function getNextOrientation() {
    return {
      x: newDice.localToGlobal('FORWARD'),
      y: newDice.localToGlobal('LEFT'),
    };
  }

  const nextState = {
    offset: getNextOffset(),
    orientation: getNextOrientation(),
  };

  return nextState;
}
