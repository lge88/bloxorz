import now from 'performance-now';

import { createEmitter } from '../lib/emitter';
import loop from '../lib/loop';

const SIMULATION_STATUS = {
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  DONE: 'DONE',
  ABORTED: 'ABORTED',
  STOPPED: 'STOPPED',
};

const DEFAULT_TIMESTEP = 1000 / 60;

function noop() {}

export function createSimulator() {
  const emitter = createEmitter();

  function addChangeListener(cb) {
    emitter.addChangeListener(cb);
  }

  function removeChangeListener(cb) {
    emitter.removeChangeListener(cb);
  }

  function clearChangeListeners() {
    emitter.clearChangeListeners();
  }

  const state = {};

  // simulation is an object:
  // {
  //   getStartState, getUpdatedState, getEndState, getAbortedState,
  //   status,
  //   state,
  //   commands,
  // }
  let simulations = [];
  let loopHandle = null;

  function run() {
    function update() {
      // Update simulations that is RUNNING.
      simulations.forEach((simulation) => {
        if (simulation.status === SIMULATION_STATUS.RUNNING) {
          const { getUpdatedState } = simulation;
          const { getEndState, getAbortedState } = simulation;
          const { state: prevState, commands } = simulation;
          const previousTime = prevState.currentTime;
          const startedTime = prevState.startedTime;

          // getUpdatedState might mutate simulation.status
          let newState = getUpdatedState(prevState, commands);

          if (simulation.status === SIMULATION_STATUS.DONE) {
            newState = getEndState(prevState);
          } else if (simulation.status === SIMULATION_STATUS.ABORTED) {
            newState = getAbortedState(prevState);
          }
          // For PAUSED/STOPPED, the state will preserved.

          // Update meta fields:
          const currentTime = now();
          simulation.state = Object.assign({}, prevState, newState, {
            startedTime,
            previousTime,
            currentTime,
          });

          // simulation.state = newState;
          mergeState(state, simulation.state.output);

          simulation.onUpdate();
        }
      });

      // Publish changes:
      simulations.forEach((simulation) => {
        // console.log('s status', simulation.status);
        if (simulation.status === SIMULATION_STATUS.DONE) {
          simulation.onEnd();
        } else if (simulation.status === SIMULATION_STATUS.ABORTED) {
          simulation.onAbort();
        }
      });
      emitter.emitChange();

      // Remove DONE/ABORTED/STOPPED simulations.
      simulations = simulations.filter((simulation) => {
        const { status } = simulation;
        return !(status === SIMULATION_STATUS.DONE ||
                 status === SIMULATION_STATUS.STOPPED ||
                 status === SIMULATION_STATUS.ABORTED);
      });

      if (simulations.length <= 0) {
        loopHandle.remove();
        loopHandle = null;
      }
    }

    // Running, do nothing.
    if (loopHandle !== null) { return; }

    loopHandle = loop.add(update);
  }

  function mergeState(state, output) {
    output.forEach(({ key, value }) => {
      state[key] = value;
    });
  }

  function getState() {
    return state;
  }

  function createSimulation({
    // Passed previousState:
    //   { startedTime: , previousTime, currentTime, output: null }
    // Returns an object of shape:
    //  { output: array of { key, value } pairs }
    // Only the data in output field will be merged to
    // simulator state.
    //
    // Example:
    // {
    //   otherMetaData1: 100,
    //   otherMetaData2: 200,
    //   ...,
    //   output: [
    //     {
    //       key: 'tile_0_0',
    //       value: { position: { x: 0, y: 0, z: 0 } }
    //     }
    //   ]
    // }
    getStartState,

    // Passed in:
    //   previousState:
    //     same shape as the object returned from getStartState
    //     with following meta fields:
    //       startedTime, previousTime, currentTime,
    //   commands: a object contains
    //     end command
    //     pause command
    //     stop command, will keep the current state.
    //     abort command
    // Return the state described in getStartState.
    // If there is any calls to end, pause, abort,
    // the return state will be ignored.
    getUpdatedState,

    // Passed in previousState
    // Return the state described in getStartState.
    getEndState,

    // Passed in previousState
    // Return the state described in getStartState.
    getAbortedState,

    onStart,
    onUpdate,
    onEnd,
    onPause,
    onResume,
    onAbort,
    onStop,
  }) {
    if (typeof getStartState !== 'function') {
      throw new Error(`Must specify getStateState to create simulation.`);
    }

    if (typeof getUpdatedState !== 'function') {
      throw new Error(`Must specify getUpdatedState to create simulation.`);
    }

    if (typeof getEndState !== 'function') {
      throw new Error(`Must specify getEndState to create simulation.`);
    }

    if (typeof getAbortedState !== 'function') {
      throw new Error(`Must specify getAbortedState to create simulation.`);
    }

    const simulation = {
      getStartState,
      getUpdatedState,
      getEndState,
      getAbortedState,
      status: null,
      state: null,
      onStart: typeof onStart === 'function' ? onStart : noop,
      onUpdate: typeof onUpdate === 'function' ? onUpdate : noop,
      onEnd: typeof onEnd === 'function' ? onEnd : noop,
      onPause: typeof onPause === 'function' ? onPause : noop,
      onResume: typeof onResume === 'function' ? onResume : noop,
      onAbort: typeof onAbort === 'function' ? onAbort : noop,
      onStop: typeof onStop === 'function' ? onStop : noop,
    };

    // For end/abort, hooks are called after state updated.
    const end = () => { simulation.status = SIMULATION_STATUS.DONE; };
    const abort = () => { simulation.status = SIMULATION_STATUS.ABORTED; };

    const pause = () => {
      simulation.status = SIMULATION_STATUS.PAUSED;
      simulation.onPause();
    };

    const stop = () => {
      simulation.status = SIMULATION_STATUS.STOPPED;
      simulation.onStop();
    };

    const resume = () => {
      simulation.status = SIMULATION_STATUS.RUNNING;
      simulation.onResume();
    };

    const start = () => {
      const { getStartState } = simulation;

      const currentTime = now();
      const previousTime = currentTime - DEFAULT_TIMESTEP;
      const startedTime = currentTime;

      const startState = getStartState({
        startedTime,
        previousTime,
        currentTime,
      });

      startState.startedTime = startedTime;
      startState.previousTime = previousTime;
      startState.currentTime = currentTime;

      simulation.state = startState;
      simulation.status = SIMULATION_STATUS.RUNNING;

      const output = startState.output;
      mergeState(state, output);

      simulations.push(simulation);

      if (loopHandle === null) {
        run();
      }

      simulation.onStart();
    };

    simulation.commands = { end, pause, abort, stop };

    const handle = {
      start,
      end,
      pause,
      resume,
      abort,
      stop,
    };

    return handle;
  }

  function _setState(partial) {
    Object.keys(partial).forEach((key) => {
      state[key] = partial[key];
    });
  }

  function _emitChange() {
    emitter.emitChange();
  }

  return {
    getState,
    createSimulation,
    addChangeListener,
    removeChangeListener,
    clearChangeListeners,
    _setState,
    _emitChange,
  };
}
