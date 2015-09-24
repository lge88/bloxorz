import { Body, Plane, Material } from 'cannon';
import { Box, Vec3 } from 'cannon';

const SHRINK = 0.98;
const material = new Material({ friction: 1.0, restitution: 0.6 });

export function createFloor({
  thickness,
  width,
  tiles,
}) {
  const bricks = createBricks(thickness, width, tiles);
  const plane = createPlane();

  return {
    plane,
    bricks,
  };
}

function createBricks(thickness, width, tiles) {
  const brickWidth = SHRINK * width;
  const shape = new Box(new Vec3(0.5 * brickWidth, 0.5 * brickWidth, 0.5 * thickness));

  const bricks = tiles.map((tile) => {
    const brick = new Body({ mass: 0 });
    const { x, y } = tile;
    brick.addShape(shape);
    brick.position = new Vec3(x * width, y * width, -0.5 * thickness);
    brick.material = material;
    return brick;
  });

  return bricks;
}

function createPlane() {
  const shape = new Plane();
  const body = new Body({ mass: 0 });
  body.addShape(shape);
  body.material = material;
  return body;
}
