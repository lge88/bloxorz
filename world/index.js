import { World, NaiveBroadphase, HingeConstraint, Body, Box, Vec3 } from 'cannon';
import { createBox } from './box';
import { createFloor } from './floor';

const STATE = {
  INITIAL_FALLING: 'INITIAL_FALLING',
  STEADY: 'STEADY',
  ROLLING: 'ROLLING',
  WINNING: 'WINNING',
  FALLING: 'FALLING',
};

const CONTROL_STATE = {
  NOOP: 'NOOP',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  FORWARD: 'FORWARD',
  BACKWARD: 'BACKWARD',
};

export function createWorld({
  box: boxState,
  floor: floorState,
}) {
  const initialZ = boxState.position.z;

  let state = STATE.INITIAL_FALLING;
  let controlState = CONTROL_STATE.NOOP;

  // Only applies in ROLLING state
  let rolling = {
    staticBody: null,
    hingeConstraint: null,
    // local force and point that will be applied to box
    force: null,
    point: null,
    nextSteadyState: null,
  };

  const world = new World();
  world.quatNormalizeSkip = 0;
  world.quatNormalizeFast = false;
  world.gravity.set(0, 0, -10);
  world.broadphase = new NaiveBroadphase();

  const box = createBox(boxState);
  const floor = createFloor(floorState);

  world.addBody(box.body);
  world.addBody(floor.plane);

  function setupBricks() {
    world.removeBody(floor.plane);
    floor.bricks.forEach((brick) => {
      world.addBody(brick);
    });
  }

  const getBoxBodyState = () => {
    return {
      position: box.body.position,
      quaternion: box.body.quaternion,
    };
  };

  const rollBoxForward = () => { controlState = CONTROL_STATE.FORWARD; };
  const rollBoxBackward = () => { controlState = CONTROL_STATE.BACKWARD; };
  const rollBoxLeft = () => { controlState = CONTROL_STATE.LEFT; };
  const rollBoxRight = () => { controlState = CONTROL_STATE.RIGHT; };

  const preUpdate = () => {
    // Make sure the hinge constraint is removed in following cases.
    if (controlState === CONTROL_STATE.NOOP ||
        state === STATE.INITIAL_FALLING ||
        state === STATE.WINNING ||
        state === STATE.FALLING) {
      if (rolling.hingeConstraint !== null) {
        world.removeConstraint(rolling.hingeConstraint);
        world.removeBody(rolling.staticBody);
        Object.assign(rolling, {
          staticBody: null,
          hingeConstraint: null,
          force: null,
          point: null,
        });
      }
    }

    switch (state) {
    case STATE.INITIAL_FALLING:
      // This do not work since initially box velocity is zero.
      // The INITIAL_FALLING state should belong to the box.
      if (box.body.position.z < initialZ - 0.1  && box.isStatic() && box.isAwake()) {
        box.setSteadyState(box.getSteadyState());
        box.sleep();

        // remove plane and add bricks
        setupBricks();
        state = STATE.STEADY;
      }
      break;

    case STATE.STEADY:
      if (controlState !== CONTROL_STATE.NOOP) {
        // TODO:
        //   - Figure out the axis and pivot of rolling
        //   - Add a static body under box.
        //   - Add hinge constraint.
        //   - Figure out the proper force and point
        const { staticBody, hingeConstraint, force, point, nextSteadyState } = box.getRollingConfiguration(controlState);

        world.addBody(staticBody);
        world.addConstraint(hingeConstraint);

        Object.assign(rolling, {
          staticBody,
          hingeConstraint,
          force,
          point,
          nextSteadyState,
        });

        box.body.applyLocalForce(rolling.force, rolling.point);

        state = STATE.ROLLING;
      }
      break;

    case STATE.ROLLING:
      if (box.isStatic() && box.isAwake()) {
        const newState = rolling.nextSteadyState;
        console.log(box.getSteadyState(), '->', newState);

        box.setSteadyState(newState);
        box.sleep();

        state = STATE.STEADY;
        controlState = CONTROL_STATE.NOOP;
      } else {
        box.body.applyLocalForce(rolling.force, rolling.point);
      }
      break;

    case STATE.WINNING:
      // TODO: call onWinning()
    case STATE.FALLING:
      // TODO: call onGameover()
    default:
      break;
    }
  };

  const dt = 1 / 60;
  const update = () => {
    preUpdate();
    world.step(dt);
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
