import { Body, Plane, Material } from 'cannon';
import { Box, Vec3 } from 'cannon';

const material = new Material({ friction: 1.0, restitution: 0.4 });

export function createFloor({
  thickness,
  width,
  tiles,
}) {
  // TODO: map a list of tiles to boxes.
  const shape = new Box(new Vec3(0.5 * width, 0.5 * width, 0.5 * thickness));

  const bricks = tiles.map((tile) => {
    const brick = new Body({ mass: 0 });
    const { x, y } = tile;
    brick.addShape(shape);
    brick.position = new Vec3(x * width, y * width, -0.5 * thickness);
    brick.material = material;
    return brick;
  });

  return {
    bricks,
  };
}
