import now from 'performance-now';
import loop from './loop';

export const STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  JUST_STARTED: 'JUST_STARTED',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  ENDED: 'ENDED',
  CANCELED: 'CANCELED',
  STOPPED: 'STOPPED',
};

const END = {};
const PAUSE = {};
const STOP = {};
const CANCEL = {};
const NIL = {};

const DEFAULT_TIMESTEP = 1000 / 60;

function noop() {}

function result(x) {
  if (typeof x === 'function') { return x(); }
  return x;
}

export function createTransition({
  // Function used to map the external state to transition state.
  // Passed in a query interface from external.
  // Returns the stripped query interface that is used inside the transition.
  // query interface could be plain data or a function that returns plain data.
  // By default it is the identity function.
  select = (query) => query,

  // Function used to map transition state to output data that will be
  // consumed by external world.
  // (transitionState, context) => outputData
  // By default it is the identity function.
  gather = (state, context) => state,

  // getStartState(), getRunningState(), getEndState(), getCancelState(),
  // are pure functions with same signature, they will be asked to
  // return a newState during different time of the transition
  // lifecycle (as the name implies).

  // Signature:
  // (previousState, context) => (nextState|special control object)
  //   previousState:
  //     Inside getStartState: state returned from result(select(query)).
  //     Inside getRunningState: state returned from getStartState() or
  //       last getRunningState().
  //     Inside getEndState, it is the object returned from last getRunningState()
  //     Inside getCancelState, it is the object returned from last getRunningState()
  //
  //   context:
  //     {
  //       status,
  //         Current transition status:
  //         Inside getStartState: NOT_STARTED -> JUST_STARTED
  //         Inside getRunningState: JUST_STARTED|RUNNING|PAUSED -> RUNNING
  //         Inside getEndState: NOT_STARTED|JUST_STARTED|RUNNING|PAUSED -> ENDED
  //         Inside getCancelState: NOT_STARTED|JUST_STARTED|RUNNING|PAUSED -> CANCELED
  //
  //       timestamps: {
  //         startTime,
  //         previousTime,
  //         currentTime,
  //       },
  //         In milliseconds
  //
  //       startState,
  //         Inside getStartState() is null. Otherwise it is the
  //         object getStartState() returned.
  //
  //       query:
  //         The query function filtered by select, i.e.,
  //         () => result(select(query))
  //
  //       END,
  //         A special object that can be returned to end the transition.
  //
  //       PAUSE,
  //         A special object that can be returned to pause the transition.
  //
  //       STOP,
  //         A special object that can be returned to stop the transition.
  //
  //       CANCEL,
  //         A special object that can be returned to cancel the transition.
  //
  //       NIL,
  //         A special object indicates no output. (so dispatch is not called).
  //     }

  // By default, getStartState is identity function.
  getStartState = (prevState, context) => prevState,

  // By default, getRunningState returns END so that it ends the transition
  // immediately and the state returned by getEndState() is used.
  getRunningState = (prevState, context) => context.END,

  // By default, getEndState produce no output.
  getEndState = (prevState, context) => context.NIL,

  // By default, getCancelState returns startState.
  getCancelState = (prevState, context) => context.startState,
}) {
  // A function connects the transition to external world.
  // query: the query interface of external world. could be plain data or
  //   a function that returns plain data.
  // dispatch: the command interface of external world. Pass in the output data
  // transition emits (if is not NIL) and status. dispatch(data, status)
  function connect(dispatch, query) {
    const transition = {
      state: null,
      context: {
        status: STATUS.NOT_STARTED,
        timestamps: {
          startTime: null,
          currentTime: null,
          previousTime: null,
        },
        startState: null,
        query: () => result(select(query)),

        END,
        PAUSE,
        STOP,
        CANCEL,
        NIL,
      },
    };

    let loopHandle = null;

    function getNextState(transition, getStateFunc) {
      const { state: prevState, context } = transition;
      const nextState = getStateFunc(prevState, context);
      return nextState;
    }

    function updateTimestamps(context) {
      const { timestamps } = context;
      const previousTime = timestamps.currentTime;
      const currentTime = now();
      Object.assign(timestamps, { previousTime, currentTime });
    }

    function updateTransitionState(transition, nextState) {
      const { state: prevState, context } = transition;

      // Explict with all possible states:
      if (nextState === END) {
        transition.state = getEndState(prevState, context);
      } else if (nextState === CANCEL) {
        transition.state = getCancelState(prevState, context);
      } else if (nextState === STOP) {
        transition.state = prevState;
      } else if (nextState === PAUSE) {
        transition.state = prevState;
      } else if (nextState === NIL) {
        transition.state = nextState;
      } else {
        transition.state = nextState;
      }
    }

    function updateLoopHandle(nextState) {
      // Explict with all possible states:
      if (nextState === END) {
        loopHandle && loopHandle.remove();
      } else if (nextState === CANCEL) {
        loopHandle && loopHandle.remove();
      } else if (nextState === STOP) {
        loopHandle && loopHandle.remove();
      } else if (nextState === PAUSE) {
        loopHandle && (loopHandle.enabled = false);
      } else if (nextState === NIL) {
        (!loopHandle) && (loopHandle = loop.add(update));
      } else {
        (!loopHandle) && (loopHandle = loop.add(update));
      }
    }

    function getNextStatus(status, nextState) {
      // Explict with all possible states:
      if (nextState === END) {
        return STATUS.ENDED;
      } else if (nextState === CANCEL) {
        return STATUS.CANCELED;
      } else if (nextState === STOP) {
        return STATUS.STOPPED;
      } else if (nextState === PAUSE) {
        return STATUS.PAUSED;
      } else {
        // NIL or other data object:
        if (status === STATUS.NOT_STARTED) {
          return STATUS.JUST_STARTED;
        } else if (status === STATUS.JUST_STARTED) {
          return STATUS.RUNNING;
        } else if (status === STATUS.RUNNING) {
          return STATUS.RUNNING;
        } else {
          return status;
        }
      }
    }

    function emit(transition) {
      const { state, context } = transition;
      const { status } = context;
      const data = gather(state, context);
      if (data !== NIL) {
        dispatch(data, status);
      }
    }

    function start() {
      const { context } = transition;
      const { status } = context;
      if (status === STATUS.NOT_STARTED) {
        // Update timestamps:
        const currentTime = now();
        const startTime = currentTime;
        const previousTime = currentTime - DEFAULT_TIMESTEP;
        context.timestamps = {
          startTime,
          currentTime,
          previousTime,
        };

        // Init transition state with external data:
        transition.state = transition.context.query();

        const nextState = getNextState(transition, getStartState);
        updateTransitionState(transition, nextState);
        updateLoopHandle(nextState);

        // Update status:
        context.status = getNextStatus(status, nextState);

        // Record startState
        context.startState = transition.state;

        // Side effects!
        emit(transition);
        handle.onStart();
      }
    }

    function update() {
      const { context } = transition;
      const { status } = context;
      // Might be not necessary:
      if (status === STATUS.JUST_STARTED ||
          status === STATUS.RUNNING) {
        updateTimestamps(context);

        const nextState = getNextState(transition, getRunningState);
        updateTransitionState(transition, nextState);
        updateLoopHandle(nextState);

        context.status = getNextStatus(status, nextState);
        emit(transition);
        handle.onUpdate();
      }
    }

    function end() {
      const { context } = transition;
      const { status } = context;
      if (status === STATUS.NOT_STARTED ||
          status === STATUS.JUST_STARTED ||
          status === STATUS.RUNNING ||
          status === STATUS.PAUSED) {
        updateTimestamps(context);

        const nextState = getNextState(transition, getEndState);
        updateTransitionState(transition, nextState);
        loopHandle && loopHandle.remove();

        context.status = STATUS.ENDED;
        emit(transition);
        handle.onEnd();
      }
    }

    function cancel() {
      const { context } = transition;
      const { status } = context;
      if (status === STATUS.NOT_STARTED ||
          status === STATUS.JUST_STARTED ||
          status === STATUS.RUNNING ||
          status === STATUS.PAUSED) {
        updateTimestamps(context);

        const nextState = getNextState(transition, getCancelState);
        updateTransitionState(transition, nextState);
        loopHandle && loopHandle.remove();

        context.status = STATUS.CANCELED;
        emit(transition);
        handle.onCancel();
      }
    }

    function stop() {
      const { context } = transition;
      const { status } = context;
      if (status === STATUS.NOT_STARTED ||
          status === STATUS.JUST_STARTED ||
          status === STATUS.RUNNING ||
          status === STATUS.PAUSED) {
        loopHandle && loopHandle.remove();
        context.status = STATUS.STOPPED;
        handle.onStop();
      }
    }

    function pause() {
      const { context } = transition;
      const { status } = context;
      if (status === STATUS.NOT_STARTED ||
          status === STATUS.JUST_STARTED ||
          status === STATUS.RUNNING) {
        loopHandle && (loopHandle.enabled = false);
        context.status = STATUS.PAUSED;
        handle.onPause();
      }
    }

    function resume() {
      const { context } = transition;
      const { status } = context;
      if (status === STATUS.PAUSED) {
        updateTimestamps(context);

        const nextState = getNextState(transition, getRunningState);
        updateTransitionState(transition, nextState);
        loopHandle && (loopHandle.enabled = true);

        context.status = STATUS.RUNNING;
        emit(transition);
        handle.onResume();
      }
    }

    const handle = {
      getStatus: () => transition.context.status,
      start,
      end,
      cancel,
      stop,
      pause,
      resume,

      // Hooks:
      onStart = noop,
      onUpdate = noop,
      onEnd = noop,
      onCancel = noop,
      onStop = noop,
      onPause = noop,
      onResume = noop,
    };

    return handle;
  }

  return connect;
}
