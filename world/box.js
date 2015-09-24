import { Box, Body, Vec3 } from 'cannon';
import { Material } from 'cannon';
const { abs, round } = Math;

const mass = 5;
const material = new Material({ friction: 1.0, restitution: 0.8 });

export function createBox({
  position,
  dimensions
}) {
  const { width, numStories } = dimensions;
  const shape = new Box(new Vec3(0.5 * width, 0.5 * width, 0.5 * width * numStories ));
  const body = new Body({ mass: mass });
  body.addShape(shape);
  body.position.copy(position);
  body.material = material;
  body.linearDamping = 0.5;

  // Returns enum('up', 'down', 'forward', 'backward', 'left', 'right', 'notStable')
  function getLocalAxisState(
    // enum('x', 'y', 'z')
    localAxis
  ) {
    const tol = 1 / 1000;
    let localVec;
    if (localAxis === 'x') {
      localVec = new Vec3(1, 0, 0);
    } else if (localAxis === 'y') {
      localVec = new Vec3(0, 1, 0);
    } else if (localAxis === 'z') {
      localVec = new Vec3(0, 0, 1);
    } else {
      throw new Error('localAxis is not one of "x", "y", "z"');
    }

    const worldVec = body.vectorToWorldFrame(localVec);
    if (abs(worldVec.x - 1.0) < tol) {
      return 'forward';
    } else if (abs(worldVec.x + 1.0) < tol) {
      return 'backward';
    } else if (abs(worldVec.y - 1.0) < tol) {
      return 'left';
    } else if (abs(worldVec.y + 1.0) < tol) {
      return 'right';
    } else if (abs(worldVec.z - 1.0) < tol) {
      return 'up';
    } else if (abs(worldVec.z + 1.0) < tol) {
      return 'down';
    }

    return 'notStable';
  }


  // Returns the top point in world frame that could used to apply force.
  // Returns null if the body is still moving.
  function getTopWorldPoint() {
    const { width: w, length: l, height: h } = dimensions;
    const xAxisState = getLocalAxisState('x');
    const yAxisState = getLocalAxisState('y');
    const zAxisState = getLocalAxisState('z');

    if (xAxisState === 'notStable' ||
        yAxisState === 'notStable' ||
        zAxisState === 'notStable') {
      console.log('notStable');
      return null;
    }

    let localPoint;
    if (xAxisState === 'up') {
      localPoint = new Vec3(0.5 * w, 0, 0);
    } else if (xAxisState === 'down') {
      localPoint = new Vec3(-0.5 * w, 0, 0);
    } else if (yAxisState === 'up') {
      localPoint = new Vec3(0, 0.5 * l, 0);
    } else if (yAxisState === 'down') {
      localPoint = new Vec3(0, -0.5 * l, 0);
    } else if (zAxisState === 'up') {
      localPoint = new Vec3(0, 0, 0.5 * h);
    } else if (zAxisState === 'down') {
      localPoint = new Vec3(0, 0, -0.5 * h);
    } else {
      console.assert(false, 'should never hit here!');
    }

    return body.pointToWorldFrame(localPoint);
  }

  function getDimensions() {
    return { width, length, height };
  }

  const Directions = { forward: 1, backward: 1, left: 1, right: 1 };
  function roll(direction) {
    if (!(direction in Directions)) return;
    const point = getTopWorldPoint();
    if (point === null) return;

    body.wakeUp();
    const f = getForceMagnitude(point);
    let force;
    if (direction === 'forward') {
      force = new Vec3(f, 0, 0);
    } else if (direction === 'backward') {
      force = new Vec3(-f, 0, 0);
    } else if (direction === 'left') {
      force = new Vec3(0, f, 0);
    } else if (direction === 'right') {
      force = new Vec3(0, -f, 0);
    }
    body.applyForce(force, point);
  }

  function snapToGrid() {
    // figure correct positions
    // let { x, y, z } = body.position;
    // const xAxisState = getLocalAxisState('x');
    // const yAxisState = getLocalAxisState('y');
    // const zAxisState = getLocalAxisState('z');

    // if (zAxisState === 'up' || zAxisState === 'down') {

    // }

    // x = snap(x, width);
    // y = snap(y, length);
    // z = snap(z, height);
    // body.position.set(x, y, z);

    // figure correct quaternion
  }

  function postUpdate() {
    if (body.velocity.length() < 0.001) {
      if (body.sleepState === Body.AWAKE) {
        snapToGrid();
        body.sleep();
      }
    }
  }

  return {
    body,
    getDimensions,
    roll,
    postUpdate,
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
