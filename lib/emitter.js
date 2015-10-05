export function createEmitter() {
  let listeners = [];

  function addChangeListener(cb) {
    listeners.push(cb);
  }

  function removeChangeListener(cb) {
    const i = listeners.indexOf(cb);
    if (i > -1) listeners.splice(i, 1);
  }

  function clearChangeListeners() {
    listeners = [];
  }

  function emitChange() {
    listeners.forEach((cb) => cb());
  }

  return {
    addChangeListener,
    removeChangeListener,
    clearChangeListeners,
    emitChange,
  };
}
