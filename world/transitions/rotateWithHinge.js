import { rotateBody } from './lib/rotate';
import bezierEasing from 'bezier-easing';

const easing = (() => {
  const fn = bezierEasing.easeOut;
  return (t) => fn.get(t);
})();

export const gather = (state) => state.bodyState;

export function getStartState({
  position,
  quaternion,
  axis,
  pivot,
  angle,
  duration,
}) {
  const bodyState = { position, quaternion };
  const startBodyState = bodyState;
  const endBodyState = rotateBody(startBodyState, pivot, axis, angle);

  return {
    axis,
    pivot,
    angle,
    duration,
    startBodyState,
    endBodyState,

    bodyState,
  };
}

export function getRunningState(state, context) {
  const { currentTime, startTime } = context.timestamps;
  const { axis, pivot, angle, duration, startBodyState } = state;
  const { END } = context;

  const t = (currentTime - startTime) / duration;

  if (t >= 1) { return END; }

  const a = angle * easing(t);
  const bodyState = rotateBody(startBodyState, pivot, axis, a);

  return Object.assign({}, state, { bodyState });
}

export function getEndState(state) {
  return { bodyState: state.endBodyState };
}

export const getCancelState = getEndState;
