import { World, NaiveBroadphase } from 'cannon';
import { createBox } from './box';
import { createFloor } from './floor';

export function createWorld({
  box: boxState,
  floor: floorState,
}) {
  const world = new World();
  world.quatNormalizeSkip = 0;
  world.quatNormalizeFast = false;
  world.gravity.set(0, 0, -10);
  world.broadphase = new NaiveBroadphase();

  const box = createBox(boxState);
  const floor = createFloor(floorState);

  world.addBody(box.body);

  floor.bricks.forEach((brick) => {
    world.addBody(brick);
  });

  const getBoxBodyState = () => {
    return {
      position: box.body.position,
      quaternion: box.body.quaternion,
    };
  };

  const rollBoxForward = box.roll.bind(box, 'forward');
  const rollBoxBackward = box.roll.bind(box, 'backward');
  const rollBoxLeft = box.roll.bind(box, 'left');
  const rollBoxRight = box.roll.bind(box, 'right');

  const dt = 1 / 60;
  const update = () => {
    world.step(dt);
    box.postUpdate();
  };

  return {
    getBoxBodyState,
    rollBoxForward,
    rollBoxBackward,
    rollBoxLeft,
    rollBoxRight,
    update,
  };
}
