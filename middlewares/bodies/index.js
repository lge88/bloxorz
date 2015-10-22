import loop from '../../lib/loop';
import now from 'performance-now';

import boxFallToFloor from './animations/boxFallToFloor';
// import boxFallOffEdge from './boxFallOffEdge';
// import boxFallInHole from './boxFallInHole';
// import boxRoll from './boxRoll';
// import boxFallWithFragileTiles from './boxFallWithFragileTiles';
// import triggerSwitches from './triggerSwitches';

const boxFallOffEdge = boxFallToFloor;
const boxFallInHole = boxFallToFloor;
const boxRoll = boxFallToFloor;
const boxFallWithFragileTiles = boxFallToFloor;
const triggerSwitches = boxFallToFloor;

function playAnimation(createFrameFunc, dispatch, getState) {
  let handle;
  const p = new Promise((resolve) => {
    const end = () => {
      handle.remove();
      resolve();
    };
    const frameFunc = createFrameFunc(dispatch, getState, end);
    const startTime = now();
    const update = () => frameFunc(now(), startTime);

    handle = loop.add(update);
  });
  return p;
}

const bodies = store => next => action => {
  const { dispatch, getState } = store;
  if (action.type === 'READY') {
    return playAnimation(boxFallToFloor, dispatch, getState)
      .then(() => next(action));
  } else if (action.type === 'ROLL') {
    return playAnimation(boxRoll(action.direction), dispatch, getState)
      .then(() => next(action))
      .then(() => {
        const status = getState().game.status;
        if (status === 'TRIGGER_SWITCHES') {
          return playAnimation(triggerSwitches, dispatch, getState);
        } else if (status === 'FALL_OFF_EDGE') {
          return playAnimation(boxFallOffEdge, dispatch, getState);
        } else if (status === 'FALL_IN_HOLE') {
          return playAnimation(boxFallInHole, dispatch, getState);
        } else if (status === 'BREAK_FRAGILE_TILES') {
          return playAnimation(boxFallWithFragileTiles, dispatch, getState);
        }

        return null;
      });
  }

  return next(action);
};

export default bodies;
