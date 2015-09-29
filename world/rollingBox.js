import { Body, Vec3 } from 'cannon';
import { Box2, Vector2 } from 'three';
import { createDice } from './dice';
const { PI } = Math;

export function createRollingBox({
  width,
  length,
  height,
  location = { x: [ 0, 0, 0 ], y: [ 0, 0, 0 ] },
  orientation = { x: 'FORWARD', y: 'LEFT' },
}) {
  const [ hfW, hfL, hfH ] = [ 0.5 * width, 0.5 * length, 0.5 * height ];
  const dice = createDice({ orientation });

  const body = new Body();
  initPosition(body.position);
  initQuaternion(body.quaternion);

  function initPosition(pos) {
    const local = dice.globalToLocal('UP');
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
    Object.assign(pos, { x, y, z});
  }

  function initQuaternion(q) {
    const localX = dice.localToGlobal('FORWARD');
    const localY = dice.localToGlobal('LEFT');
    const localZ = dice.localToGlobal('UP');
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

  function getPosition() {
    return body.position;
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
    let offset;
    if (direction === 'FORWARD') {
      [ xOrY, offset ] = [ 'x', 1 ];
    } else if (direction === 'BACKWARD') {
      [ xOrY, offset ] = [ 'x', -1 ];
    } else if (direction === 'LEFT') {
      [ xOrY, offset ] = [ 'y', 1 ];
    } else if (direction === 'RIGHT') {
      [ xOrY, offset ] = [ 'y', -1 ];
    } else {
      throw new Error(`Invalid direction ${direction}.`);
    }

    let nextLocation = getLocation();

    ['UP', direction].forEach((dir) => {
      let local = dice.globalToLocal(dir);
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
      nextLocation[xOrY][dim] += offset;
    });

    return nextLocation;
  }

  function rolled(direction) {
    const nextLocation = getNextLocation(direction);

    const { newDice } = dice.roll(direction);
    const nextOrientation = {
      x: newDice.localToGlobal('FORWARD'),
      y: newDice.localToGlobal('LEFT'),
    };

    return createRollingBox({
      width,
      length,
      height,
      location: nextLocation,
      orientation: nextOrientation,
    });
  }

  // This method could be optimized by caching.
  // Returns the interpolated state of rolling.
  // direction in {FORWARD,BACKWARD,LEFT,RIGHT}
  // t in [0, 1]
  // returns { position, quaternion }
  // getSteadyState() === roll(direction, 0)
  // rolled(direction).getSteadyState() === roll(direction, 1)
  function roll(direction) {
    const dims = [ width, length, height ];
    let { axis, pivot } = dice.roll(direction);

    pivot = pivot.map((val, i) => val * dims[i]);
    pivot = new Vec3(...pivot);
    pivot = body.pointToWorldFrame(pivot);

    axis = new Vec3(...axis);
    axis = body.vectorToWorldFrame(axis);

    return { pivot, axis };
  }

  function getLocation() {
    return {
      x: [ ...location.x ],
      y: [ ...location.y ]
    };
  }

  function getBox2OnXY() {
    const { x, y } = getPosition();
    const min = new Vector2();
    const max = new Vector2();

    const globalX = dice.globalToLocal('FORWARD');
    if (globalX === 'FORWARD' || globalX === 'BACKWARD') {
      min.x = x - hfW;
      max.x = x + hfW;
    } else if (globalX === 'LEFT' || globalX === 'RIGHT') {
      min.x = x - hfL;
      max.x = x + hfL;
    } else if (globalX === 'UP' || globalX === 'DOWN') {
      min.x = x - hfH;
      max.x = x + hfH;
    } else {
      throw new Error(`Invalid axis ${globalX}`);
    }

    const globalY = dice.globalToLocal('LEFT');
    if (globalY === 'FORWARD' || globalY === 'BACKWARD') {
      min.y = y - hfW;
      max.y = y + hfW;
    } else if (globalY === 'LEFT' || globalY === 'RIGHT') {
      min.y = y - hfL;
      max.y = y + hfL;
    } else if (globalY === 'UP' || globalY === 'DOWN') {
      min.y = y - hfH;
      max.y = y + hfH;
    } else {
      throw new Error(`Invalid axis ${globalY}`);
    }

    return new Box2(min, max);
  }

  return {
    getSteadyState,
    getBox2OnXY,
    getLocation,
    roll,
    rolled,
  };
}
