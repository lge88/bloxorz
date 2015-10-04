import now from 'performance-now';
import bezierEasing from 'bezier-easing';
import { World, NaiveBroadphase } from 'cannon';
import { Body, Material } from 'cannon';
import { Plane, Box, Vec3 } from 'cannon';

import { createRollingBox } from './rollingBox';
import { createFloor } from './floor';
import { rotatedDisplacements } from './rotate';
const { PI } = Math;

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

  const { nx, ny, nz, position: boxPosition } = boxOptions;
  const initialHeight = boxPosition.z;
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
    axis: null,
    pivot: null,
  };

  const floor = createFloor({
    goal,
    width: gridSize,
    tiles,
  });

  const { world, box, plane } = initPhysicalWorld();

  const easing = (() => {
    const ease = bezierEasing[ROLLING_EASING_TYPE];
    return (t) => ease.get(t);
  })();

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
    body.position.copy(boxPosition);
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

  const shouldWin = () => {
    return box.position.z < -0.3;
  };

  const shouldLose = () => {
    return box.position.z < -0.3;
  };

  const setupRollingState = (direction) => {
    const { currentBox } = rolling;
    const { pivot, axis } = currentBox.roll(direction);
    const nextBox = currentBox.rolled(direction);
    const startedTime = now();
    Object.assign(rolling, {
      nextBox,
      startedTime,
      direction,
      pivot,
      axis
    });
  };

  const clearRollingState = () => {
    rolling.nextBox = null;
    rolling.startedTime = null;
    rolling.direction = null;
    rolling.pivot = null;
    rolling.axis = null;
  };

  const setBoxToSteadyState = () => {
    const { position, quaternion } = rolling.currentBox.getSteadyState();
    box.position.copy(position);
    box.quaternion.copy(quaternion);
    box.velocity.setZero();
    box.angularVelocity.setZero();
  };

  const rotateBoxBy = (angle) => {
    const { pivot, axis } = rolling;
    const rollingBox = rolling.currentBox;
    const { position, quaternion } = rotatedDisplacements(rollingBox.getSteadyState(), pivot, axis, angle);
    box.position.copy(position);
    box.quaternion.copy(quaternion);
  };

  const dt = 1 / 60;
  const update = () => {
    const currentTime = now();
    switch (state) {
    case STATE.FALLING_TO_FLOOR:
      world.step(dt);
      if (doneInitialFalling()) {
        setBoxToSteadyState();

        box.type = Body.STATIC;
        state = STATE.STEADY;
      }
      break;

    case STATE.STEADY:
      if (controlState !== CONTROL_STATE.NOOP) {
        const direction = controlState;
        setupRollingState(direction);

        box.type = Body.STATIC;
        state = STATE.ROLLING;
      }
      break;

    case STATE.ROLLING:
      const t = (currentTime - rolling.startedTime) / ROLLING_DURATION;
      if (t >= 1) {
        rolling.currentBox = rolling.nextBox;
        setBoxToSteadyState();

        const rect = rolling.currentBox.getBox2OnXY();
        if (floor.shouldFallToGoal(rect)) {
          // Remove infinite plane so the box will free fall.
          world.removeBody(plane);

          box.type = Body.DYNAMIC;
          state = STATE.FALLING_TO_GOAL_HOLE;
        } else if (floor.shouldFallOffEdge(rect)) {
          // Replace infinite plane with bricks under the box.
          world.removeBody(plane);
          const bricks = floor.getPhysicalBricksUnderBox(rect);
          bricks.forEach((brick) => world.addBody(brick));

          box.type = Body.DYNAMIC;
          state = STATE.FALLING_OFF_EDGE;
        } else {
          box.type = Body.STATIC;
          state = STATE.STEADY;
        }

        controlState = CONTROL_STATE.NOOP;
        clearRollingState();
      } else {
        const angle = 0.5 * PI * easing(t);
        rotateBoxBy(angle);
      }
      break;

    case STATE.FALLING_TO_GOAL_HOLE:
      world.step(dt);
      if (shouldWin()) { state = STATE.WON; }
      break;

    case STATE.FALLING_OFF_EDGE:
      world.step(dt);
      if (shouldLose()) { state = STATE.LOST; }
      break;

    case STATE.WON:
      break;

    case STATE.LOST:
      break;

    default:
      break;
    }
  };

  const getBoxBodyState = () => {
    return {
      position: box.position,
      quaternion: box.quaternion,
    };
  };

  const getState = () => {
    return {
      state,
      bodies: {
        box: getBoxBodyState(),
      },
    };
  };

  const roll = (direction) => {
    if (direction in CONTROL_STATE) {
      controlState = CONTROL_STATE[direction];
      return;
    }
    throw new Error(`Invalid roll direction ${direction}.`);
  };

  return {
    getBoxBodyState,
    getState,
    roll,
    update,
  };
}
