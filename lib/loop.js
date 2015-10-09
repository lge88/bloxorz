function createLoop() {
  // handle: { enabled: Bool, func: Function, active: Bool }
  let handles = [];
  let animationId = null;

  function start() {
    function update() {
      const len = handles.length;
      for (let i = 0; i < len; ++i) {
        const handle = handles[i];
        if (handle.enabled && handle.active) {
          handle.frameFunc();
        }
      }

      const newHandles = [];
      for (let i = 0; i < len; ++i) {
        const handle = handles[i];
        if (handle.active) {
          newHandles.push(handle);
        }
      }

      handles = newHandles;
      if (handles.length > 0) {
        animationId = requestAnimationFrame(update);
      } else {
        animationId = null;
      }
    }
    update();
  }

  function clear() {
    handles = [];
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  function remove(index) {
    const handle = handles[index];
    if (typeof handle !== 'undefined') {
      handle.active = false;
    }
  }

  function add(frameFunc) {
    const handle = {
      active: true,
      enabled: true,
      frameFunc,
    };

    const index = handles.length;
    handles.push(handle);

    handle.remove = remove.bind(null, index);

    if (animationId === null) {
      start();
    }

    return handle;
  }

  return {
    add,
    clear,
  };
}

const loop = createLoop();
export default loop;
