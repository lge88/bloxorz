import { Box2, Vector2 } from 'three';
const { round } = Math;

export function createFloor({
  goal,
  width,
  tiles,
}) {
  const goalXYInWorld = xyToWorldFrame(goal);
  const hole = new Box2(new Vector2(
    goalXYInWorld.x - width,
    goalXYInWorld.y - width
  ), new Vector2(
    goalXYInWorld.x + width,
    goalXYInWorld.y + width
  ));

  // expand a little to eliminate numeric error.
  hole.expandByVector(new Vector2(0.01 * width, 0.01 * width));

  const tileLUT = createTilesLUT(tiles);

  function createTilesLUT(tiles) {
    return tiles.reduce((lut, tile) => {
      const key = tileKeyFromLocation({ x: tile.x, y: tile.y });
      lut[key] = tile;
      return lut;
    }, {});
  }

  function tileKeyFromLocation({ x, y }) {
    return `${x},${y}`;
  }

  function xyToLocalFrame({ x, y }) {
    return { x: round(x / width), y: round(y / width) };
  }

  function xyToWorldFrame({ x, y }) {
    return { x: x * width, y: y * width };
  }

  function getTileAtLocation({ x, y }) {
    const key = tileKeyFromLocation({ x, y });
    const tile = tileLUT[key];
    if (typeof tile === 'undefined') {
      return null;
    }
    return tile;
  }

  function shouldFallToGoal(box2) {
    return hole.containsBox(box2);
  }

  // Not real physical behaviour.
  // Just count how many tiles are under box2
  // if less than 50%, fall.
  function shouldFallOffEdge(box2) {
    const { min, max } = box2;
    min.x += 0.5 * width;
    min.y += 0.5 * width;
    max.x -= 0.5 * width;
    max.y -= 0.5 * width;

    const locationMin = xyToLocalFrame(min);
    const locationMax = xyToLocalFrame(max);
    const total = (locationMax.x - locationMin.x + 1) *
            (locationMax.y - locationMin.y + 1);
    let count = 0;
    for (let i = locationMin.x; i <= locationMax.x; ++i) {
      for (let j = locationMin.y; j <= locationMax.y; ++j) {
        const tile = getTileAtLocation({ x: i, y: j });
        count += tile === null ? 0 : 1;
      }
    }

    return count / total <= 0.5;
  }

  // Returns 0 if no box, otherwise the height (integer) of box.
  function getPressureAtLocation({ x, y }) {

  }

  return {
    shouldFallToGoal,
    shouldFallOffEdge,
  };
}
