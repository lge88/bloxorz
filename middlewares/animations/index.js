import loop from '../../lib/loop';
import now from 'performance-now';

import boxFallToFloor from './boxFallToFloor';
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

const animations = store => next => action => {
  const { dispatch, getState } = store;
  if (action.type === 'LOAD_STAGE_SUCCESS') {
    next(action);
    playAnimation(boxFallToFloor, dispatch, getState);
  } else if (action.type === 'ROLL') {
    playAnimation(boxRoll(action.direction), dispatch, getState)
      .then(() => {
        const status = getState().game.status;
        if (status === 'TRIGGER_SWITCHES') {
          return playAnimation(triggerSwitches, dispatch, getState);
        }
      })
      .then(() => next(action))
      .then(() => {
        const status = getState().game.status;
        if (status === 'FALL_OFF_EDGE') {
          playAnimation(boxFallOffEdge, dispatch, getState);
        } else if (status === 'FALL_IN_HOLE') {
          playAnimation(boxFallInHole, dispatch, getState);
        } else if (status === 'BREAK_FRAGILE_TILES') {
          playAnimation(boxFallWithFragileTiles, dispatch, getState);
        }
      });
  } else {
    next(action);
  }
};

export default animations;
