import { Box, Body, Vec3 } from 'cannon';
import { Material } from 'cannon';
import { Vector3 } from 'three';
const { abs, round } = Math;

const mass = 5;
const material = new Material({ friction: 1.0, restitution: 0.8 });
const STEADY_THRESHOLD = 1 / 1000;
const DIRECTIONS = {
  up: new Vector3(0, 0, 1),
  down: new Vector3(0, 0, -1),
  forward: new Vector3(1, 0, 0),
  backward: new Vector3(-1, 0, 0),
  left: new Vector3(0, 1, 0),
  right: new Vector3(0, -1, 0),
};

export function createBox({
  position,
  dimensions
}) {
  const { width, numStories } = dimensions;
  const height = width * numStories;
  const shape = new Box(new Vec3(0.5 * width, 0.5 * width, 0.5 * height ));
  const body = new Body({ mass: mass });
  body.addShape(shape);
  body.position.copy(position);
  body.material = material;
  body.linearDamping = 0.5;

  // Returns enum('up', 'down', 'forward', 'backward', 'left', 'right')
  function getLocalAxisDirection(
    // enum('x', 'y', 'z')
    localAxis
  ) {
    let localVec;
    if (localAxis === 'x') {
      localVec = new Vector3(1, 0, 0);
    } else if (localAxis === 'y') {
      localVec = new Vector3(0, 1, 0);
    } else if (localAxis === 'z') {
      localVec = new Vector3(0, 0, 1);
    } else {
      throw new Error('localAxis is not one of "x", "y", "z"');
    }

    const worldVec = body.vectorToWorldFrame(localVec);
    const { direction } = findClosestDirection(worldVec, DIRECTIONS);
    return direction;
  }

  // { direction, angle }
  function findClosestDirection(vec, directions) {
    let minAngle = Infinity;
    let closestDirection = null;
    const v = (new Vector3()).copy(vec);
    Object.keys(directions).forEach((dir) => {
      const dirVec = directions[dir];
      const angle = v.angleTo(dirVec);
      if (angle < minAngle) {
        minAngle = angle;
        closestDirection = dir;
      }
      // console.log(dir, 'anlgle', angle, 'min', minAngle, 'closest', closestDirection);
    });

    return {
      direction: closestDirection,
      vector: directions[closestDirection].clone(),
      angle: minAngle
    };
  }

  const RollDirections = {
    forward: new Vec3(1, 0, 0),
    backward: new Vec3(-1, 0, 0),
    left: new Vec3(0, 1, 0),
    right: new Vec3(0, -1, 0),
  };

  // Returns the force and point in local frame could make box roll.
  // rollDirection: {'left','right','forward','backward'}
  function getRollingForceAndPoint(rollDirection) {
    const xAxisState = getLocalAxisDirection('x');
    const yAxisState = getLocalAxisDirection('y');
    const zAxisState = getLocalAxisDirection('z');
    const [ hfW, hfH ] = [ 0.5 * width, 0.5 * height];

    // Returns the center of current top face.
    function getTopCenter() {
      let topCenter;
      if (xAxisState === 'up') {
        topCenter = new Vec3(hfW, 0, 0);
      } else if (xAxisState === 'down') {
        topCenter = new Vec3(-hfW, 0, 0);
      } else if (yAxisState === 'up') {
        topCenter = new Vec3(0, hfW, 0);
      } else if (yAxisState === 'down') {
        topCenter = new Vec3(0, -hfW, 0);
      } else if (zAxisState === 'up') {
        topCenter = new Vec3(0, 0, hfH);
      } else if (zAxisState === 'down') {
        topCenter = new Vec3(0, 0, -hfH);
      } else {
        console.assert(false, 'should never hit here!');
      }
      return topCenter;
    }

    function getNormalizedForce() {
      const globalVec = RollDirections[rollDirection];
      const localVec = body.vectorToLocalFrame(globalVec);
      const { vector } = findClosestDirection(localVec, DIRECTIONS);
      return vector;
    }

    function getForceMag(point, force) {
      if (abs(point.z) === hfH) {
        return 3.5;
      }

      if (abs(force.z) === 0) {
        return 4.0;
      }
      return 8.0;
    }

    const point = getTopCenter();
    const force = getNormalizedForce();
    const mag = getForceMag(point, force);

    force.multiplyScalar(mag);
    return { force, point };
  }

  function roll(direction) {
    if (!(direction in RollDirections)) return;

    const { force, point } = getRollingForceAndPoint(direction);
    console.log('force', force, 'point', point);

    body.wakeUp();
    body.applyLocalImpulse(force, point);
  }

  // { zAxisState, yAxisState, xi, yi }
  function getSteadyConfig() {
    const zAxisState = getLocalAxisDirection('z');
    const yAxisState = getLocalAxisDirection('y');
    const { x, y } = body.position;
    const xi = round(x / width * 2) / 2;
    const yi = round(y / width * 2) / 2;
    return { zAxisState, yAxisState, xi, yi };
  }

  function setSteadyConfig(config) {
    const { zAxisState, yAxisState, xi, yi } = config;
    const x = xi * width;
    const y = yi * width;
    let z;
    if (zAxisState === 'up' || zAxisState === 'down') {
      z = 0.5 * height;
    } else {
      z = 0.5 * width;
    }
    body.position.set(x, y, z);

    // figure correct positions
    // let { x, y, z } = body.position;
    // const xAxisState = getLocalAxisDirection('x');
    // const yAxisState = getLocalAxisDirection('y');
    // const zAxisState = getLocalAxisDirection('z');

    // if (zAxisState === 'up' || zAxisState === 'down') {

    // }

    // x = snap(x, width);
    // y = snap(y, length);
    // z = snap(z, height);

    // figure correct quaternion
  }

  function isSteady() {
    return body.velocity.length() < STEADY_THRESHOLD;
  }

  function isAwake() {
    return body.sleepState === Body.AWAKE;
  }

  function sleep() {
    body.sleep();
  }

  return {
    body,
    roll,
    isSteady,
    isAwake,
    sleep,
    getSteadyConfig,
    setSteadyConfig,
  };
}

function snap(val, gridSpacing) {
  return round(val / gridSpacing) * gridSpacing;
}


function getForceMagnitude(angularAcceleration, dimensions, topPoint) {
  return 200;
  // TODO: figure I from dimensions and oriantation.
  /* const I = 100;
     const moment = angularAcceleration * I;
     return moment / topPoint.z; */
}
