// http://rackt.github.io/redux/docs/advanced/Middleware.html
// Add paused flag.
const noop = () => {};

const rafScheduler = store => next => {
  let queuedActions = [];
  let frame = null;

  function loop() {
    frame = null;
    try {
      if (queuedActions.length) {
        next(queuedActions.shift());
      }
    } finally {
      maybeRaf();
    }
  }

  function maybeRaf() {
    if (queuedActions.length && !frame) {
      frame = requestAnimationFrame(loop);
    }
  }

  return action => {
    if (!action.meta || !action.meta.raf) {
      return next(action);
    }

    const paused = store.getState().raf.paused;
    if (paused) {
      return noop;
    }

    queuedActions.push(action);
    maybeRaf();

    return function cancel() {
      queuedActions = queuedActions.filter(a => a !== action);
    };
  };
};

export default rafScheduler;
