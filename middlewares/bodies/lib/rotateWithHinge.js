import { rotateBody } from './rotate';
import bezierEasing from 'bezier-easing';

const DEFAULT_EASING = (() => {
  const easing = bezierEasing.easeOut;
  return (t) => easing.get(t);
})();

export default function createSimulation({
  key,
  position,
  quaternion,
  axis,
  pivot,
  angle,
  duration,
  easing = DEFAULT_EASING,
  onEnd,
}) {
  function getEndState(state) {
    const { key, endBodyState } = state;

    return {
      output: [
        { key, value: endBodyState },
      ],
    };
  }

  return {
    getStartState() {
      const startBodyState = { position, quaternion };
      const endBodyState = rotateBody(startBodyState, pivot, axis, angle);

      return {
        key,
        axis,
        pivot,
        angle,
        duration,
        startBodyState,
        endBodyState,

        output: [
          { key, value: startBodyState },
        ],
      };
    },

    getUpdatedState(state, commands) {
      const { currentTime, startedTime, duration } = state;
      const { axis, pivot, angle, startBodyState } = state;
      const { key } = state;
      const { end } = commands;

      const t = (currentTime - startedTime) / duration;

      if (t >= 1) { return end(); }

      const a = angle * easing(t);
      const bodyState = rotateBody(startBodyState, pivot, axis, a);

      return {
        output: [
          { key, value: bodyState },
        ],
      };
    },

    getEndState,
    getAbortedState: getEndState,
    onEnd,
  };
}
