import { Body, Quaternion, Vec3 } from 'cannon';
import { createCube } from '../lib/roll';
const { PI } = Math;

export function createRollingBox({
  width,
  length,
  height,
  initialLocation = { x: [ 0, 0, 0 ], y: [ 0, 0, 0 ] },
  initialOrientation = { x: 'FORWARD', y: 'LEFT' },
}) {
  const [ hfW, hfL, hfH ] = [ 0.5 * width, 0.5 * length, 0.5 * height ];
  const cube = createCube({ initialOrientation });
  const location = {
    x: [ ...initialLocation.x ],
    y: [ ...initialLocation.y ],
  };
  const body = new Body();
  initPosition(body.position);
  initQuaternion(body.quaternion);

  function getPosition() {
    return body.position;
  }

  function initPosition(pos) {
    const local = cube.globalToLocal('UP');
    let z;
    if (local === 'FORWARD' || local === 'BACKWARD') {
      z = hfW;
    } else if (local === 'LEFT' || local === 'RIGHT') {
      z = hfL;
    } else if (local === 'UP' || local === 'DOWN') {
      z = hfH;
    } else {
      throw new Error(`Invalid local orientation. ${local}`);
    }
    const [ x1, x2, x3 ] = location.x;
    const [ y1, y2, y3 ] = location.y;
    const x = hfW * x1 + hfL * x2 + hfH * x3;
    const y = hfW * y1 + hfL * y2 + hfH * y3;
    pos.x = x;
    pos.y = y;
    pos.z = z;
  }

  function initQuaternion(q) {
    const localX = cube.localToGlobal('FORWARD');
    const localY = cube.localToGlobal('LEFT');
    const localZ = cube.localToGlobal('UP');
    let euler = [0, 0, 0, 'XYZ'];
    if (localZ === 'UP') {
      if (localX === 'FORWARD') euler = [ 0, 0, 0, 'XYZ' ];
      else if (localX === 'LEFT') euler = [ 0, 0, PI / 2, 'XYZ' ];
      else if (localX === 'BACKWARD') euler = [ 0, 0, PI, 'XYZ' ];
      else if (localX === 'RIGHT') euler = [ 0, 0, -PI / 2, 'XYZ' ];
    } else if (localZ === 'DOWN') {
      if (localX === 'FORWARD') euler = [ PI, 0, 0, 'XYZ' ];
      else if (localX === 'LEFT') euler = [ PI, 0, -PI / 2, 'XYZ' ];
      else if (localX === 'BACKWARD') euler = [ PI, 0, PI, 'XYZ' ];
      else if (localX === 'RIGHT') euler = [ PI, 0, PI / 2, 'XYZ' ];
    } else if (localY === 'UP') {
      if (localX === 'FORWARD') euler = [ PI / 2, 0, 0, 'XYZ' ];
      else if (localX === 'LEFT') euler = [ PI / 2, PI / 2, 0, 'XYZ' ];
      else if (localX === 'BACKWARD') euler = [ PI / 2, PI, 0, 'XYZ' ];
      else if (localX === 'RIGHT') euler = [ PI / 2, -PI / 2, 0, 'XYZ' ];
    } else if (localY === 'DOWN') {
      if (localX === 'FORWARD') euler = [ -PI / 2, 0, 0, 'XYZ' ];
      else if (localX === 'LEFT') euler = [ -PI / 2, -PI / 2, 0, 'XYZ' ];
      else if (localX === 'BACKWARD') euler = [ -PI / 2, PI, 0, 'XYZ' ];
      else if (localX === 'RIGHT') euler = [ -PI / 2, PI / 2, 0, 'XYZ' ];
    } else if (localX === 'UP') {
      if (localY === 'FORWARD') euler = [ -PI / 2, -PI / 2, 0, 'YXZ' ];
      else if (localY === 'LEFT') euler = [ 0, -PI / 2, 0, 'YXZ' ];
      else if (localY === 'BACKWARD') euler = [ PI / 2, -PI / 2, 0, 'YXZ' ];
      else if (localY === 'RIGHT') euler = [ PI, -PI / 2, 0, 'YXZ' ];
    } else if (localX === 'DOWN') {
      if (localY === 'FORWARD') euler = [ PI / 2, PI / 2, 0, 'YXZ' ];
      else if (localY === 'LEFT') euler = [ 0, PI / 2, 0, 'YXZ' ];
      else if (localY === 'BACKWARD') euler = [ -PI / 2, PI / 2, 0, 'YXZ' ];
      else if (localY === 'RIGHT') euler = [ PI, PI / 2, 0, 'YXZ' ];
    }
    q.setFromEuler(...euler);
  }

  function getQuaternion() {
    return body.quaternion;
  }

  function getSteadyState() {
    return {
      position: getPosition(),
      quaternion: getQuaternion(),
    };
  }

  function getNextLocation(direction) {
    let xOrY;
    let step;
    if (direction === 'FORWARD') {
      [ xOrY, step ] = [ 'x', 1 ];
    } else if (direction === 'BACKWARD') {
      [ xOrY, step ] = [ 'x', -1 ];
    } else if (direction === 'LEFT') {
      [ xOrY, step ] = [ 'y', 1 ];
    } else if (direction === 'RIGHT') {
      [ xOrY, step ] = [ 'y', -1 ];
    } else {
      throw new Error(`Invalid direction ${direction}.`);
    }

    let nextLocation = getLocation();

    ['UP', direction].forEach((dir) => {
      let local = cube.globalToLocal(dir);
      let dim;
      if (local === 'FORWARD' || local === 'BACKWARD') {
        dim = 0;
      } else if (local === 'LEFT' || local === 'RIGHT') {
        dim = 1;
      } else if (local === 'UP' || local === 'DOWN') {
        dim = 2;
      } else {
        throw new Error(`Invalid local orientation. ${local}`);
      }
      nextLocation[xOrY][dim] += step;
    });

    return nextLocation;
  }

  function rolled(direction) {
    const nextLocation = getNextLocation(direction);

    const { newCube } = cube.roll(direction);
    const nextOrientation = {
      x: newCube.localToGlobal('FORWARD'),
      y: newCube.localToGlobal('LEFT'),
    };

    return createRollingBox({
      width,
      length,
      height,
      initialLocation: nextLocation,
      initialOrientation: nextOrientation,
    });
  }

  const degreeToRad = (() => {
    const factor = PI / 180;
    return (deg) => {
      return deg * factor;
    };
  })();

  // direction in {FORWARD,BACKWARD,LEFT,RIGHT}
  // degree in [0, 90]
  // returns { position, quaternion }
  // rolled(direction).getSteadyState() === roll(direction, 90)
  function roll(direction, degree) {
    const dims = [ width, length, height ];
    let { axis, pivot } = cube.roll(direction);

    pivot = pivot.map((val, i) => val * dims[i]);
    pivot = new Vec3(...pivot);
    pivot = body.pointToWorldFrame(pivot);

    axis = new Vec3(...axis);
    axis = body.vectorToWorldFrame(axis);

    const angle = degreeToRad(degree);
    const q = new Quaternion();
    q.setFromAxisAngle(axis, angle);
    const quaternion = q.mult(getQuaternion());

    const tmpFrame = new Body();
    tmpFrame.position.copy(pivot);
    const centroidInTmpFrame = tmpFrame.pointToLocalFrame(getPosition());

    tmpFrame.quaternion.copy(q);
    const position = tmpFrame.pointToWorldFrame(centroidInTmpFrame);

    return { position, quaternion };
  }

  function getLocation() {
    return {
      x: [ ...location.x ],
      y: [ ...location.y ]
    };
  }

  return {
    getSteadyState,
    getLocation,
    roll,
    rolled,
  };
}
