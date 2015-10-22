export function resize(state, action) {
  const { width, height } = action;
  const viewPort = { width, height };
  return Object.assign({}, state, { viewPort });
}
