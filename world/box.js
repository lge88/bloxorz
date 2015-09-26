import { Box, Body, Vec3, Quaternion, HingeConstraint } from 'cannon';
import { Vector3 } from 'three';
const { abs, round, PI } = Math;
import { box as material } from './materials';
import { FORWARD, LEFT, UP } from '../lib/roll';
import { BACKWARD, RIGHT, DOWN, createOrientation } from '../lib/roll';
import { roll } from '../lib/roll';

const mass = 5;
const VELOCITY_THRESHOLD = 1 / 100;
const ANGULAR_VELOCITY_THRESHOLD = 1 / 100;
const FORCE_MAGNITUDES = {
  SMALL: 20,
  MEDIUM: 30,
  LARGE: 40,
};

export function createBox({
  position,
  dimensions
}) {
  const { width, numStories } = dimensions;
  const height = width * numStories;
  const [ hfW, hfH ] = [ 0.5 * width, 0.5 * height ];

  let steadyState = {
    orientation: createOrientation(FORWARD, LEFT, UP),
    location: { x: 0, y: 0 },
  };

  const body = createBody();

  function createBody() {
    const shape = new Box(new Vec3(0.5 * width, 0.5 * width, 0.5 * height ));
    const body = new Body({ mass: mass });
    body.addShape(shape);
    body.position.copy(position);
    body.material = material;
    body.linearDamping = 0.5;
    return body;
  }

  function getForceMagnitude(orientation, rollingDir) {
    const z = orientation[UP];
    if (z === UP || z === DOWN) {
      return FORCE_MAGNITUDES.SMALL;
    } else if (z === FORWARD || z === BACKWARD) {
      if (rollingDir === 'FORWARD' || rollingDir === 'BACKWARD') {
        return FORCE_MAGNITUDES.LARGE;
      } else if (rollingDir === 'LEFT' || rollingDir === 'RIGHT') {
        return FORCE_MAGNITUDES.MEDIUM;
      }
    } else if (z === LEFT || z === RIGHT) {
      if (rollingDir === 'FORWARD' || rollingDir === 'BACKWARD') {
        return FORCE_MAGNITUDES.MEDIUM;
      } else if (rollingDir === 'LEFT' || rollingDir === 'RIGHT') {
        return FORCE_MAGNITUDES.LARGE;
      }
    }

    throw new Error('Should not reach here.');
  }

  // { axis, pivot, point, force, nextSteadyState }
  function getRollingConfiguration(rollingDirection) {
    const orientation = steadyState.orientation;

    /* debugger; */
    let {
      axis,
      pivot,
      force,
      point,
      newOrientation,
    } = roll(rollingDirection, orientation);

    const axisA = new Vec3(...axis);
    axis = body.vectorToWorldFrame(axis);

    const dims = [ width, width, height ];
    pivot = pivot.map((val, i) => val * dims[i]);
    pivot = new Vec3(...pivot);
    const pivotA = pivot;

    pivot = body.pointToWorldFrame(pivot);

    const forceMag = getForceMagnitude(orientation, rollingDirection);
    force = force.map((f) => f * forceMag);
    force = new Vec3(...force);

    point = point.map((val, i) => val * dims[i]);
    point = new Vec3(...point);

    const staticBody = new Body({ mass: 0 });
    staticBody.addShape(new Box(new Vec3(hfW, hfW, hfW)));
    staticBody.position.x = body.position.x;
    staticBody.position.y = body.position.y;
    staticBody.position.z = -hfW;

    const axisB = staticBody.vectorToLocalFrame(axis);
    const pivotB = staticBody.pointToLocalFrame(pivot);

    const hingeConstraint = new HingeConstraint(body, staticBody, {
      pivotA,
      axisA,
      pivotB,
      axisB,
    });

    const nextSteadyState = {
      orientation: newOrientation,
      location: getNextLocation(rollingDirection),
    };

    return { staticBody, hingeConstraint, point, force, nextSteadyState };
  }

  function getNextLocation(rollingDirection) {
    let { x, y } = steadyState.location;
    const [ xAxisState, yAxisState, zAxisState ] = getLocalAxisState(steadyState.orientation);
    const smallOffset = 1;
    const largeOffset = 0.5 * (numStories + 1);

    switch (rollingDirection) {
    case 'FORWARD':
      if (zAxisState === LEFT || zAxisState === RIGHT) {
        x += smallOffset;
      } else {
        x += largeOffset;
      }
      break;
    case 'BACKWARD':
      if (zAxisState === LEFT || zAxisState === RIGHT) {
        x -= smallOffset;
      } else {
        x -= largeOffset;
      }
      break;
    case 'LEFT':
      if (zAxisState === FORWARD || zAxisState === BACKWARD) {
        y += smallOffset;
      } else {
        y += largeOffset;
      }
      break;
    case 'RIGHT':
      if (zAxisState === FORWARD || zAxisState === BACKWARD) {
        y -= smallOffset;
      } else {
        y -= largeOffset;
      }
      break;
    default:
    }
    return { x, y };
  }

  function getLocalAxisState(orientation) {
    const result = Array(6);
    orientation.forEach((el, i) => {
      result[el] = i;
    });
    return result;
  }

  function setSteadyState(state) {
    steadyState = state;

    const { position, quaternion } = getBodyStateFromSteadyState(state);
    body.position.copy(position);
    body.quaternion.copy(quaternion);

    body.velocity.setZero();
    body.angularVelocity.setZero();
    /* body.force.setZero(); */
    /* body.torque.setZero(); */
  }

  // Returns { position, quaternion }
  function getBodyStateFromSteadyState({
    orientation,
    location,
  }) {
    const [ xAxisState, yAxisState, zAxisState ] = getLocalAxisState(orientation);
    const { x: xi, y: yi } = location;
    const x = xi * width;
    const y = yi * width;
    let z;
    if (zAxisState === UP || zAxisState === DOWN) {
      z = 0.5 * height;
    } else {
      z = 0.5 * width;
    }
    const position = new Vec3(x, y, z);

    const quaternion = new Quaternion();
    let euler = [0, 0, 0, 'XYZ'];
    if (zAxisState === UP) {
      if (xAxisState === FORWARD) euler = [ 0, 0, 0, 'XYZ' ];
      else if (xAxisState === LEFT) euler = [ 0, 0, PI / 2, 'XYZ' ];
      else if (xAxisState === BACKWARD) euler = [ 0, 0, PI, 'XYZ' ];
      else if (xAxisState === RIGHT) euler = [ 0, 0, -PI / 2, 'XYZ' ];
    } else if (zAxisState === DOWN) {
      if (xAxisState === FORWARD) euler = [ PI, 0, 0, 'XYZ' ];
      else if (xAxisState === LEFT) euler = [ PI, 0, -PI / 2, 'XYZ' ];
      else if (xAxisState === BACKWARD) euler = [ PI, 0, PI, 'XYZ' ];
      else if (xAxisState === RIGHT) euler = [ PI, 0, PI / 2, 'XYZ' ];
    } else if (yAxisState === UP) {
      if (xAxisState === FORWARD) euler = [ PI / 2, 0, 0, 'XYZ' ];
      else if (xAxisState === LEFT) euler = [ PI / 2, PI / 2, 0, 'XYZ' ];
      else if (xAxisState === BACKWARD) euler = [ PI / 2, PI, 0, 'XYZ' ];
      else if (xAxisState === RIGHT) euler = [ PI / 2, -PI / 2, 0, 'XYZ' ];
    } else if (yAxisState === DOWN) {
      if (xAxisState === FORWARD) euler = [ -PI / 2, 0, 0, 'XYZ' ];
      else if (xAxisState === LEFT) euler = [ -PI / 2, -PI / 2, 0, 'XYZ' ];
      else if (xAxisState === BACKWARD) euler = [ -PI / 2, PI, 0, 'XYZ' ];
      else if (xAxisState === RIGHT) euler = [ -PI / 2, PI / 2, 0, 'XYZ' ];
    } else if (xAxisState === UP) {
      if (yAxisState === FORWARD) euler = [ -PI / 2, -PI / 2, 0, 'YXZ' ];
      else if (yAxisState === LEFT) euler = [ 0, -PI / 2, 0, 'YXZ' ];
      else if (yAxisState === BACKWARD) euler = [ PI / 2, -PI / 2, 0, 'YXZ' ];
      else if (yAxisState === RIGHT) euler = [ PI, -PI / 2, 0, 'YXZ' ];
    } else if (xAxisState === DOWN) {
      if (yAxisState === FORWARD) euler = [ PI / 2, PI / 2, 0, 'YXZ' ];
      else if (yAxisState === LEFT) euler = [ 0, PI / 2, 0, 'YXZ' ];
      else if (yAxisState === BACKWARD) euler = [ -PI / 2, PI / 2, 0, 'YXZ' ];
      else if (yAxisState === RIGHT) euler = [ PI, PI / 2, 0, 'YXZ' ];
    }
    quaternion.setFromEuler(...euler);
    return { position, quaternion };
  }

  function isStatic() {
    return body.velocity.length() < VELOCITY_THRESHOLD &&
      body.angularVelocity.length() < ANGULAR_VELOCITY_THRESHOLD;
  }

  function isOnTheGround() {
    const { orientation } = steadyState;
    const [ xAxisState, yAxisState, zAxisState ] = getLocalAxisState(orientation);
    const tol = 1e-3;
    if (zAxisState === UP || zAxisState === DOWN) {
      return abs(body.position.z - 0.5 * height) < tol;
    }
    return abs(body.position.z - 0.5 * width) < tol;
  }

  function isAwake() {
    return body.sleepState === Body.AWAKE;
  }

  function sleep() {
    body.sleep();
  }

  function getSteadyState() {
    return steadyState;
  }

  return {
    body,
    roll,
    isStatic,
    isOnTheGround,
    isAwake,
    sleep,
    getRollingConfiguration,
    setSteadyState,
    getSteadyState,
  };
}
