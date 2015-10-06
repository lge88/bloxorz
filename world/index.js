import now from 'performance-now';
import bezierEasing from 'bezier-easing';
import { World, NaiveBroadphase } from 'cannon';
import { Body, Material } from 'cannon';
import { Plane, Box, Vec3 } from 'cannon';

import { STATE, CONTROL_STATE, DEFAULT_MATERIAL } from './constants';
import { ROLLING_DURATION, ROLLING_EASING_TYPE } from './constants';
import { createRollingBox } from './rollingBox';
import { createFloor } from './floor';
import { rotateBody } from './rotate';
const { PI } = Math;

const easing = (() => {
  const ease = bezierEasing[ROLLING_EASING_TYPE];
  return (t) => ease.get(t);
})();

export function createWorld({
  goal,
  gridSize,
  boxOptions,
  floorOptions,
  tiles,
}) {
  const { nx, ny, nz, position: boxPosition } = boxOptions;
  const initialHeight = boxPosition.z;

  let state = STATE.FALLING_TO_FLOOR;
  let controlState = CONTROL_STATE.NOOP;
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
    thickness: floorOptions.thickness,
    tiles,
  });

  const { world, box, plane } = initPhysicalWorld();
  const bodies = {
    box,
  };

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
    world.gravity.set(0, 0, -15);
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
    return box.position.z < -0.5;
  };

  const shouldLose = () => {
    return box.position.z < -0.5;
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
    const { currentBox, pivot, axis } = rolling;
    const steadyBodyState = currentBox.getSteadyState();
    const { position, quaternion } = rotateBody(
      steadyBodyState,
      pivot,
      axis,
      angle
    );
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

        if (floor.shouldFallInHole(rolling.currentBox)) {
          // Remove infinite plane so the box will free fall.
          world.removeBody(plane);

          box.type = Body.DYNAMIC;
          state = STATE.FALLING_IN_HOLE;
        } else if (floor.shouldFallOffEdge(rolling.currentBox)) {
          // Replace infinite plane with static bricks under the box.
          world.removeBody(plane);
          const bricks = floor.getPhysicalBricksUnderBox(rolling.currentBox);
          bricks.forEach((brick) => {
            world.addBody(brick);
            bodies[brick._key] = brick;
          });

          box.type = Body.DYNAMIC;
          state = STATE.FALLING_OFF_EDGE;
        } else if (floor.shouldBreakFragileTile(rolling.currentBox)) {
          // Replace infinite plane with falling bricks under the box.
          world.removeBody(plane);
          const bricks = floor.getPhysicalFragileBricksUnderBox(rolling.currentBox);
          bricks.forEach((brick) => {
            world.addBody(brick);
            bodies[brick._key] = brick;
          });

          box.type = Body.DYNAMIC;
          state = STATE.FALLING_WITH_FRAGILE_TILE;
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

    case STATE.FALLING_IN_HOLE:
      world.step(dt);
      if (shouldWin()) { state = STATE.WON; }
      break;

    case STATE.FALLING_OFF_EDGE:
    case STATE.FALLING_WITH_FRAGILE_TILE:
      world.step(dt);
      if (shouldLose()) { state = STATE.LOST; }
      break;

    case STATE.WON:
    case STATE.LOST:
    default:
      break;
    }
  };

  const getState = () => {
    return {
      state,
      bodies,
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
    getState,
    roll,
    update,
  };
}
