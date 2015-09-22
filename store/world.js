import { World, Box, Body, Vec3 } from 'cannon';
import { Plane, NaiveBroadphase, Material } from 'cannon';

function createBox(position, dimensions) {
  const mass = 5;
  const material = new Material({ friction: 1.0, restitution: 0.6 });
  const { width: w, length: l, height: h } = dimensions;
  const boxShape = new Box(new Vec3(0.5 * w, 0.5 * l, 0.5 * h));
  const boxBody = new Body({ mass: mass });
  boxBody.addShape(boxShape);
  boxBody.position.copy(position);
  boxBody.material = material;
  boxBody.linearDamping = 0.5;
  return boxBody;
}

function createFloor(tiles) {
  // TODO: map a list of tiles to boxes.
  const material = new Material({ friction: 1.0, restitution: 0.6 });
  const groundShape = new Plane();
  const floor = new Body({ mass: 0 });
  floor.addShape(groundShape);
  floor.material = material;
  return floor;
}

export function createWorld({
  initialBoxPosition = { x: 0, y: 0, z: 1.0 },
  boxDimensions = { width: 0.1, length: 0.1, height: 0.2 },
  tiles = [],
}) {
  const world = new World();
  world.quatNormalizeSkip = 0;
  world.quatNormalizeFast = false;
  world.gravity.set(0, 0, -10);
  world.broadphase = new NaiveBroadphase();

  const boxBody = createBox(initialBoxPosition, boxDimensions);
  const floor = createFloor(tiles);

  world.add(boxBody);
  world.add(floor);

  const dt = 1 / 60;
  const update = () => {
    world.step(dt);
    if (boxBody.velocity.length() < 0.001) {
      if (boxBody.sleepState === Body.AWAKE) {
        // TODO: Snap position, quaternion to grid, set velocity to zero.
        /* let { x, y, z } = boxBody.position; */
        /* z = abs(z - 0.1) < abs(z - 0.05) ? 0.1 : 0.05; */
        /* boxBody.position.set(x, y, z); */
        /* boxBody.velocity.setZero(); */
        boxBody.sleep();
      }
    }
  };

  const getBoxBodyState = () => {
    return {
      position: boxBody.position,
      quaternion: boxBody.quaternion,
    };
  };

  const rollBoxForward = () => {
    boxBody.wakeUp();
    const force = new Vec3(200, 0, 0);
    const point = new Vec3(0, 0, 0.5 * boxDimensions.height);
    boxBody.applyLocalForce(force, point);
  };

  const rollBoxBackward = () => {
    boxBody.wakeUp();
    const force = new Vec3(200, 0, 0);
    const point = new Vec3(0, 0, 0.5 * boxDimensions.height);
    boxBody.applyLocalForce(force, point);
  };

  const rollBoxLeft = () => {
    boxBody.wakeUp();
    const force = new Vec3(200, 0, 0);
    const point = new Vec3(0, 0, 0.5 * boxDimensions.height);
    boxBody.applyLocalForce(force, point);
  };

  const rollBoxRight = () => {
    boxBody.wakeUp();
    const force = new Vec3(200, 0, 0);
    const point = new Vec3(0, 0, 0.5 * boxDimensions.height);
    boxBody.applyLocalForce(force, point);
  };

  return {
    update,
    rollBoxForward,
    rollBoxBackward,
    rollBoxLeft,
    rollBoxRight,
    getBoxBodyState,
  };
}
