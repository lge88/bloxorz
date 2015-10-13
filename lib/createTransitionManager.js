export default function createTransitionManager() {
  let handles = [];

  function removeTerminatedHandles() {
    handles = handles.filter((handle) => {
      const status = handle.getStatus();
      return status !== 'ENDED' &&
        status !== 'CANCELED' &&
        status !== 'STOPPED';
    });
  }

  function add(handle) {
    const { onEnd, onCancel, onStop } = handle;
    handle.onEnd = () => {
      onEnd();
      removeTerminatedHandles();
    };

    handle.onCancel = () => {
      onCancel();
      removeTerminatedHandles();
    };

    handle.onStop = () => {
      onStop();
      removeTerminatedHandles();
    };
    handle.start();
  }

  function pause() {
    handles.forEach((handle) => handle.pause());
  }

  function resume() {
    handles.forEach((handle) => handle.resume());
  }

  function end() {
    handles.forEach((handle) => handle.end());
  }

  function cancel() {
    handles.forEach((handle) => handle.cancel());
  }

  return {
    add,
    pause,
    resume,
    end,
    cancel,
  };
}
