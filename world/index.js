import { World, NaiveBroadphase } from 'cannon';
import { Body, Material } from 'cannon';
import { Plane, Box, Vec3 } from 'cannon';
import { createRollingBox } from './rollingBox';
import now from 'performance-now';
import bezierEasing from 'bezier-easing';

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

const DEFAULT_MATERIAL = {
  friction: 1.0,
  restitution: 0.6
};

const ROLLING_DURATION = 150;
const ROLLING_EASING_TYPE = 'easeOut';

export function createWorld({
  goal,
  gridSize,
  boxOptions,
  tiles,
}) {
  let state = STATE.FALLING_TO_FLOOR;
  let controlState = CONTROL_STATE.NOOP;

  const { nx, ny, nz, initialHeight } = boxOptions;
  let rolling = {
    currentBox: createRollingBox({
      width: nx * gridSize,
      length: ny * gridSize,
      height: nz * gridSize,
      location: { x: [ 0, 0, 0 ], y: [ 0, 0, 0] },
      orientation: { x: 'FORWARD', y: 'LEFT' },
    }),

    direction: null,
    startedTime: null,
    nextBox: null,
  };

  const tileLUT = createTilesLUT(tiles);

  const { world, box, plane } = initPhysicalWorld();

  const easing = (() => {
    const ease = bezierEasing[ROLLING_EASING_TYPE];
    return (t) => ease.get(t);
  })();

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
    const s = gridSize;
    const shape = new Box(new Vec3(0.5 * nx * s, 0.5 * ny * s, 0.5 * nz * s ));
    const body = new Body({ mass: 5.0 });
    body.addShape(shape);
    body.position.set(0, 0, initialHeight);
    body.material = new Material(DEFAULT_MATERIAL);
    body.linearDamping = 0.5;
    return body;
  }

  function createCannonPlane() {
    const shape = new Plane();
    const body = new Body({ mass: 0 });
    body.addShape(shape);
    body.material = new Material(DEFAULT_MATERIAL);
    return body;
  }

  function doneInitialFalling() {
    return box.position.z < 0.9 * initialHeight &&
      box.velocity.length() < 1 / 100 &&
      box.angularVelocity.length() < 1 / 100;
  }

  // TODO: check the dimension of box against the hole as well.
  const shouldFallToGoal = () => {
    const location = rolling.currentBox.getLocation();
    const xs = location.x;
    const ys = location.y;
    const x = 0.5 * (nx * xs[0] + ny * xs[1] + nz * xs[2]);
    const y = 0.5 * (nx * ys[0] + ny * ys[1] + nz * ys[2]);
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
    return body.position.z < -0.3;
  };

  const isLost = () => {
    return body.position.z < -0.3;
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
        const rollingBox = rolling.currentBox;
        const t_ = easing(t);
        const { position, quaternion } = rollingBox.roll(rolling.direction, t_);
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
