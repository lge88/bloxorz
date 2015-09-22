import { Body, Plane, Material } from 'cannon';

export function createFloor(tiles) {
  // TODO: map a list of tiles to boxes.
  const material = new Material({ friction: 1.0, restitution: 0.6 });
  const groundShape = new Plane();
  const floor = new Body({ mass: 0 });
  floor.addShape(groundShape);
  floor.material = material;
  return floor;
}
