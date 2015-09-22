const nextId = (() => {
  let idCount = 0;
  return () => {
    return idCount++;
  };
})();

function createLoop() {
  // A dictionary of frame function to invoke;
  // key: Unique String, value: { enabled: Bool, func: Function }
  const handles = {};

  let count = 0;
  let animationId = null;

  function start() {
    function update() {
      Object.keys(handles).forEach((id) => {
        const handle = handles[id];
        if (handle.enabled) {
          handle.frameFunc();
        }
      });
      animationId = requestAnimationFrame(update);
    }
    update();
  }

  function stop() {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  function remove(id) {
    if (typeof handles[id] !== 'undefined') {
      delete handles[id];
      count--;
    }

    if (count <= 0) {
      stop();
    }
  }

  function add(frameFunc) {
    const id = nextId();
    const handle = {
      enabled: true,
      frameFunc,
      remove: remove.bind(null, id),
    };

    handles[id] = handle;
    count++;

    if (count > 0 && animationId === null) {
      start();
    }

    return handle;
  }

  return {
    add,
  };
}

const loop = createLoop();
export default loop;
