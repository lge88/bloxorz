import { World, NaiveBroadphase, Body, Box, Vec3 } from 'cannon';
import { Plane, Material } from 'cannon';
import { createRollingBox } from './rollingBox';
const now = Date.now.bind(Date);

const STATE = {
  FALLING_TO_FLOOR: 'FALLING_TO_FLOOR',
  STEADY: 'STEADY',
  ROLLING: 'ROLLING',
  FALLING_TO_GOAL_HOLE: 'FALLING_TO_GOAL_HOLE',
  FALLING_OFF_EDGE: 'FALLING_OFF_EDGE',
  WON: 'WON',
  LOST: 'LOST',
};

const CONTROL_STATE = {
  NOOP: 'NOOP',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  FORWARD: 'FORWARD',
  BACKWARD: 'BACKWARD',
};

const DEFAULT_MATERIAL = new Material({
  friction: 1.0,
  restitution: 0.6
});

const ROLLING_DURATION = 100;

export function createWorld({
  goal,
  gridWidth,
  boxNumStories,
  boxInitialHeight,
  tiles,
}) {
  let state = STATE.FALLING_TO_FLOOR;
  let controlState = CONTROL_STATE.NOOP;

  let rolling = {
    currentBox: createRollingBox({
      width: gridWidth,
      length: gridWidth,
      height: gridWidth * boxNumStories,
      initialLocation: { x: [ 0, 0, 0 ], y: [ 0, 0, 0] },
      initialOrientation: { x: 'FORWARD', y: 'LEFT' },
    }),

    direction: null,
    startedTime: null,
    nextBox: null,
  };

  const tileLUT = createTilesLUT(tiles);

  const { world, box, plane } = initPhysicalWorld();

  function tileKeyFromLocation(x, y) {
    return `${x},${y}`;
  }

  function createTilesLUT(tiles) {
    return tiles.reduce((lut, tile) => {
      const key = tileKeyFromLocation(tile.x, tile.y);
      lut[key] = tile;
      return lut;
    }, {});
  }

  function getTileAtLocation(x, y) {
    const key = tileKeyFromLocation(x, y);
    const tile = tileLUT[key];
    if (typeof tile === 'undefined') {
      return null;
    }
    return tile;
  }

  function initPhysicalWorld() {
    const world = createCannonWorld();
    const box = createCannonBox();
    const plane = createCannonPlane();
    world.addBody(box);
    world.addBody(plane);
    return { world, box, plane };
  }

  function createCannonWorld() {
    const world = new World();
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;
    world.gravity.set(0, 0, -10);
    world.broadphase = new NaiveBroadphase();
    return world;
  }

  function createCannonBox() {
    const width = gridWidth;
    const height = boxNumStories * width;
    const shape = new Box(new Vec3(0.5 * width, 0.5 * width, 0.5 * height ));
    const body = new Body({ mass: 5.0 });
    body.addShape(shape);
    body.position.set(0, 0, boxInitialHeight);
    body.material = DEFAULT_MATERIAL;
    body.linearDamping = 0.5;
    return body;
  }

  function createCannonPlane() {
    const shape = new Plane();
    const body = new Body({ mass: 0 });
    body.addShape(shape);
    body.material = DEFAULT_MATERIAL;
    return body;
  }

  function doneInitialFalling() {
    return box.position.z < 0.9 * boxInitialHeight &&
      box.velocity.length() < 1 / 1000 &&
      box.angularVelocity.length() < 1 / 1000;
  }

  const shouldFallToGoal = () => {
    const location = rolling.currentBox.getLocation();
    const xs = location.x;
    const ys = location.y;
    const x = 0.5 * (xs[0] + xs[1] + xs[2] * boxNumStories);
    const y = 0.5 * (ys[0] + ys[1] + ys[2] * boxNumStories);
    return x === goal.x && y === goal.y;
  };

  // TODO:
  const shouldFallOffEdge = () => {
    return false;
    /* const location = rolling.currentBox.getLocation(); */
    /* const tile = getTileAtLocation(location.x, location.y); */
    /* floor.at(location) */
  };

  const shouldWin = () => {
    return box.body.position.z < -0.3;
  };

  const isLost = () => {
    return box.body.position.z < -0.3;
  };

  const dt = 1 / 60;
  const update = () => {
    switch (state) {
    case STATE.FALLING_TO_FLOOR:
      if (doneInitialFalling()) {
        box.type = Body.STATIC;
        box.velocity.setZero();
        box.angularVelocity.setZero();
        state = STATE.STEADY;
      }
      break;

    case STATE.STEADY:
      if (controlState !== CONTROL_STATE.NOOP) {
        rolling.nextBox = rolling.currentBox.rolled(controlState);
        rolling.startedTime = now();
        rolling.direction = controlState;
        state = STATE.ROLLING;
      }
      break;

    case STATE.ROLLING:
      const currentTime = now();
      const t = (currentTime - rolling.startedTime) / ROLLING_DURATION;
      if (t >= 1) {
        rolling.currentBox = rolling.nextBox;
        rolling.startedTime = null;
        rolling.direction = null;
        rolling.nextBox = null;

        const { position, quaternion } = rolling.currentBox.getSteadyState();
        box.position.copy(position);
        box.quaternion.copy(quaternion);

        if (shouldFallToGoal()) {
          state = STATE.FALLING_TO_GOAL_HOLE;
          world.removeBody(plane);
          box.type = Body.DYNAMIC;
          break;
        }

        if (shouldFallOffEdge()) {
          state = STATE.FALLING_OFF_EDGE;
          world.removeBody(plane);
          // TODO: to make it fall in half-hanging situation.
          // box should have angular velocity.
          box.type = Body.DYNAMIC;
          break;
        }

        box.type = Body.STATIC;
        controlState = CONTROL_STATE.NOOP;
        state = STATE.STEADY;
      } else {
        const deg = 90 * t;
        const { position, quaternion } = rolling.currentBox.roll(rolling.direction, deg);
        box.position.copy(position);
        box.quaternion.copy(quaternion);
      }
      break;

    case STATE.WILL_WIN:
      const { z } = box.body.position;
      // should fall some distance before claim winning;
      if (z < -0.3) { state = STATE.WON; }
      break;

    case STATE.WON:
      break;
      // TODO: call onWon()

    case STATE.LOST:
      // TODO: call onLost()

      break;

    default:
      break;
    }

    world.step(dt);
  };

  const getBoxBodyState = () => {
    return {
      position: box.position,
      quaternion: box.quaternion,
    };
  };

  const rollBoxForward = () => { controlState = CONTROL_STATE.FORWARD; };
  const rollBoxBackward = () => { controlState = CONTROL_STATE.BACKWARD; };
  const rollBoxLeft = () => { controlState = CONTROL_STATE.LEFT; };
  const rollBoxRight = () => { controlState = CONTROL_STATE.RIGHT; };

  return {
    getBoxBodyState,
    rollBoxForward,
    rollBoxBackward,
    rollBoxLeft,
    rollBoxRight,
    update,
  };
}
