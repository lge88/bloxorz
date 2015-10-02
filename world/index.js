import now from 'performance-now';
import bezierEasing from 'bezier-easing';
import { World, NaiveBroadphase } from 'cannon';
import { Body, Material } from 'cannon';
import { Plane, Box, Vec3 } from 'cannon';

import { createRollingBox } from './rollingBox';
import { createFloor } from './floor';
import { rotatedDisplacements, rotatedVelocities } from './rotate';
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
const ROLLING_RATE = 0.5 * PI / (ROLLING_DURATION / 1000);

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

  // TODO: check the dimension of box against the hole as well.
  const shouldFallToGoal = () => {
    const box2 = rolling.currentBox.getBox2OnXY();
    return floor.shouldFallToGoal(box2);
  };

  // TODO:
  const shouldFallOffEdge = () => {
    debugger;
    const box2 = rolling.currentBox.getBox2OnXY();
    return floor.shouldFallOffEdge(box2);
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

  const clearRollingState = () => {
    rolling.nextBox = null;
    rolling.startedTime = null;
    rolling.direction = null;
    rolling.pivot = null;
    rolling.axis = null;
  };

  const dt = 1 / 60;
  const update = () => {
    switch (state) {
    case STATE.FALLING_TO_FLOOR:
      if (doneInitialFalling()) {
        const { position, quaternion } = rolling.currentBox.getSteadyState();
        box.position.copy(position);
        box.quaternion.copy(quaternion);
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

        const { pivot, axis } = rolling.currentBox.roll(controlState);
        rolling.pivot = pivot;
        rolling.axis = axis;

        box.type = Body.STATIC;
        state = STATE.ROLLING;
      }
      break;

    case STATE.ROLLING:
      const currentTime = now();
      const t = (currentTime - rolling.startedTime) / ROLLING_DURATION;
      if (t >= 1) {
        rolling.currentBox = rolling.nextBox;

        const { position, quaternion } = rolling.currentBox.getSteadyState();
        box.position.copy(position);
        box.quaternion.copy(quaternion);

        const rect = rolling.currentBox.getBox2OnXY();
        if (floor.shouldFallToGoal(rect)) {
          state = STATE.FALLING_TO_GOAL_HOLE;
          world.removeBody(plane);
          box.type = Body.DYNAMIC;
        } else if (floor.shouldFallOffEdge(rect)) {
          // Replace infinite plane with bricks under the box
          world.removeBody(plane);

          const bricks = floor.getPhysicalBricksUnderBox(rect);
          bricks.forEach((brick) => {
            world.addBody(brick);
          });

          state = STATE.FALLING_OFF_EDGE;
          box.type = Body.DYNAMIC;
        } else {
          box.type = Body.STATIC;
          controlState = CONTROL_STATE.NOOP;
          state = STATE.STEADY;
        }

        clearRollingState();
      } else {
        const { pivot, axis } = rolling;
        const angle = 0.5 * PI * easing(t);
        const rollingBox = rolling.currentBox;
        const { position, quaternion } = rotatedDisplacements(rollingBox.getSteadyState(), pivot, axis, angle);

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

  const roll = (direction) => {
    if (direction in CONTROL_STATE) {
      controlState = CONTROL_STATE[direction];
      return;
    }
    throw new Error(`Invalid roll direction ${direction}.`);
  };

  return {
    getBoxBodyState,
    roll,
    update,
  };
}
