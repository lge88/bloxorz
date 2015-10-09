import now from 'performance-now';
import loop from './loop';

export const STATUS = {
  NOT_STARTED: 'NOT_STARTED',
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

const DEFAULT_TIMESTEP = 1000 / 60;

function noop() {}

function identity(x) { return x; }

export function createTransition({
  // Function used to map the external state to transition state.
  // Passed in getState()
  // getState specified in connect(getState, dispatch):
  // Returns state object.
  select = (getState) => getState(),

  // Function used to map transition state to data that will be
  // cosumed by external world.
  // (transitionState, context) => action
  gather = identity,

  // getStartState(), getRunningState(), getEndState(),
  // getCancelState() are pure functions shared same signature, they
  // will be asked to return a newState during different time of the
  // transition lifecycle (as the name implies).

  // Signature:
  // (previousState, context) => (nextState|special control object)
  //   previousState:
  //     Inside getStartState, it is the object returned from select().
  //     Inside getRunningState, it is the object returned from getStartState() or
  //       last getRunningState().
  //     Inside getEndState, it is the object returned from last getRunningState()
  //     Inside getCancelState, it is the object returned from last getRunningState()
  //
  //   context:
  //     {
  //       status,
  //         Current transition status:
  //         Inside getStartState: NOT_STARTED -> RUNNING
  //         Inside getRunningState: RUNNING|PAUSED -> RUNNING
  //         Inside getEndState: NOT_STARTED|RUNNING|PAUSED -> ENDED
  //         Inside getCancelState: NOT_STARTED|RUNNING|PAUSED -> CANCELED
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
  //         object getStartState() returned
  //
  //       getState:
  //         The getState() function in connect(getState, dispatch);
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
  //     }
  getStartState = identity,
  getRunningState = (prevState, context) => context.END,
  getEndState = identity,
  getCancelState = (prevState, context) => context.startState,
}) {
  function connect(getState, dispatch) {
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
        getState,

        END,
        PAUSE,
        STOP,
        CANCEL,
      },
    };

    let loopHandle = null;

    function getNextState(transition, getStateFunc) {
      const { state: prevState, context } = transition;
      const nextState = getStateFunc(prevState, context);
      return nextState;
    }

    function updateTimestamps(context) {
      // Update timestamps:
      const { timestamps } = context;
      const previousTime = timestamps.currentTime;
      const currentTime = now();
      Object.assign(timestamps, { previousTime, currentTime });
    }

    function updateTransitionState(transition, nextState) {
      const { state: prevState, context } = transition;
      if (nextState === END) {
        transition.state = getEndState(prevState, context);
      } else if (nextState === CANCEL) {
        transition.state = getCancelState(prevState, context);
      } else if (nextState === STOP) {
        transition.state = prevState;
      } else if (nextState === PAUSE) {
        transition.state = prevState;
      } else {
        transition.state = nextState;
      }
    }

    function updateLoopHandle(nextState) {
      if (nextState === END) {
        loopHandle && loopHandle.remove();
      } else if (nextState === CANCEL) {
        loopHandle && loopHandle.remove();
      } else if (nextState === STOP) {
        loopHandle && loopHandle.remove();
      } else if (nextState === PAUSE) {
        loopHandle && (loopHandle.enabled = false);
      } else {
        (!loopHandle) && (loopHandle = loop.add(update));
      }
    }

    function emit(transition) {
      const { state, context } = transition;
      const data = gather(state, context);
      dispatch(data);
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

        // Init transition state with select():
        transition.state = select(getState);

        const nextState = getNextState(transition, getStartState);
        updateTransitionState(transition, nextState);
        updateLoopHandle(nextState);

        // Record startState
        context.startState = transition.state;

        // Update status:
        context.status = STATUS.RUNNING;

        // Side effects!
        emit(transition);
      }
    }

    function update() {
      const { context } = transition;
      const { status } = context;
      // Might be not necessary:
      if (status === STATUS.RUNNING) {
        updateTimestamps(context);

        const nextState = getNextState(transition, getRunningState);
        updateTransitionState(transition, nextState);
        updateLoopHandle(nextState);

        emit(transition);
      }
    }

    function end() {
      const { context } = transition;
      const { status } = context;
      if (status === STATUS.NOT_STARTED ||
          status === STATUS.RUNNING ||
          status === STATUS.PAUSED) {
        updateTimestamps(context);

        const nextState = getNextState(transition, getEndState);
        updateTransitionState(transition, nextState);
        loopHandle && loopHandle.remove();

        context.status = STATUS.ENDED;
        emit(transition);
      }
    }

    function cancel() {
      const { context } = transition;
      const { status } = context;
      if (status === STATUS.NOT_STARTED ||
          status === STATUS.RUNNING ||
          status === STATUS.PAUSED) {
        updateTimestamps(context);

        const nextState = getNextState(transition, getCancelState);
        updateTransitionState(transition, nextState);
        loopHandle && loopHandle.remove();

        context.status = STATUS.CANCELED;
        emit(transition);
      }
    }

    function stop() {
      const { context } = transition;
      const { status } = context;
      if (status === STATUS.NOT_STARTED ||
          status === STATUS.RUNNING ||
          status === STATUS.PAUSED) {
        updateTimestamps(context);

        updateTransitionState(transition, transition.state);
        loopHandle && loopHandle.remove();

        context.status = STATUS.STOPPED;
        emit(transition);
      }
    }

    function pause() {
      const { context } = transition;
      const { status } = context;
      if (status === STATUS.NOT_STARTED ||
          status === STATUS.RUNNING) {
        loopHandle && (loopHandle.enabled = false);
        context.status = STATUS.PAUSED;
      }
    }

    function resume() {
      const { context } = transition;
      const { status } = context;
      if (status === STATUS.PAUSED) {
        const currentTime = now();
        const previousTime = currentTime - DEFAULT_TIMESTEP;
        context.timestamps = {
          currentTime,
          previousTime,
        };

        const nextState = getNextState(transition, getRunningState);
        updateTransitionState(transition, nextState);
        loopHandle && (loopHandle.enabled = true);

        context.status = STATUS.RUNNING;
        emit(transition);
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
    };

    return handle;
  }

  return connect;
}
