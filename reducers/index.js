import initialState from './initialState';
import { loadStageAttempt, loadStageFail, loadStageSuccess } from './stage';
import { roll } from './game';
import { updateBodies } from './world';
import { resize } from './viewPort';

export default function reduce(state = initialState, action) {
  switch (action.type) {
  case 'LOAD_STAGE_ATTEMPT':
    return loadStageAttempt(state, action);

  case 'LOAD_STAGE_FAIL':
    return loadStageFail(state, action);

  case 'LOAD_STAGE_SUCCESS':
    return loadStageSuccess(state, action);

  // Actually not an action, but a hook for middleware.
  case 'READY': return state;

  case 'ROLL':
    return roll(state, action);

  case 'UPDATE_BODIES':
    return updateBodies(state, action);

  case 'RESIZE':
    return resize(state, action);

  default:
    return state;
  }
}
