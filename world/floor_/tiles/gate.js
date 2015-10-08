export function createGateTile({
  x, y, type,
  axis,
  enabled,
  singleUse,
}) {
  const _axis;
  const pivot;

  function getState() {
    return {
      x,
      y,
      type,
      enabled,
      singleUse,
    };
  }

  // Return a simulation object.
  function toggle() {
    enabled = !(enabled);
  }

  return {
    x, y, type,
    axis,
    enabled,
    singleUse,

    toggle,
  };
}
