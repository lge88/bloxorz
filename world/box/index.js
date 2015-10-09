import { Body, Vec3 } from 'cannon';
import { createDice } from './dice';
const { PI } = Math;

/**
 * Creates an immuatable box object describes the rolling behaviour.
 *     /+------/+ --/
 *    / |     / |   |
 *   +--------| |   |
 *   | /+-----+/|   | nz = 2
 *   |/ | o   | |   | (number of unit cubes
 *   +--------+ |   | stacked in z direction)
 *   | /+-----|-+ --/
 *   |/       |/
 *   +--------+
 *   |--------|
 *   unitLength = 0.1
 *   (physical unit length of the box,
 *   i.e., the box dimension is:
 *   (nx x unitLength) x (ny * unitLength) x (nz x unitLength) )
 */
// TODO: add documentation for `offset' and `orietation'.
export function createBox({
  unitLength,
  dimension,
  offset = { x: [ 0, 0, 0 ], y: [ 0, 0, 0 ] },
  orientation = { x: 'FORWARD', y: 'LEFT' },
}) {
  const hfUnit = 0.5 * unitLength;
  const [ nx, ny, nz ] = dimension;
  const [ width, length, height ] = [ nx * unitLength, ny * unitLength, nz * unitLength ];
  const dice = createDice({ orientation });

  const body = new Body();
  initPosition(body.position);
  initQuaternion(body.quaternion);

  function resolveOffset(aOffset) {
    const [ x1, x2, x3 ] = aOffset.x;
    const [ y1, y2, y3 ] = aOffset.y;
    const x = nx * x1 + ny * x2 + nz * x3;
    const y = nx * y1 + ny * y2 + nz * y3;
    return { x, y };
  }

  function getHalfUnitPosition() {
    const { x, y } = resolveOffset(offset);
    const local = dice.globalToLocal('UP');
    let z;
    if (local === 'FORWARD' || local === 'BACKWARD') {
      z = nx;
    } else if (local === 'LEFT' || local === 'RIGHT') {
      z = ny;
    } else if (local === 'UP' || local === 'DOWN') {
      z = nz;
    } else {
      throw new Error(`Invalid local orientation. ${local}`);
    }
    return { x, y, z };
  }

  function initPosition(pos) {
    const { x, y, z } = getHalfUnitPosition();
    Object.assign(pos, {
      x: x * hfUnit,
      y: y * hfUnit,
      z: z * hfUnit,
    });
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

  function getNextOffset(direction) {
    let xOrY;
    let increment;
    if (direction === 'FORWARD') {
      [ xOrY, increment ] = [ 'x', 1 ];
    } else if (direction === 'BACKWARD') {
      [ xOrY, increment ] = [ 'x', -1 ];
    } else if (direction === 'LEFT') {
      [ xOrY, increment ] = [ 'y', 1 ];
    } else if (direction === 'RIGHT') {
      [ xOrY, increment ] = [ 'y', -1 ];
    } else {
      throw new Error(`Invalid direction ${direction}.`);
    }

    let nextOffset = {
      x: [ ...offset.x ],
      y: [ ...offset.y ],
    };

    ['UP', direction].forEach((dir) => {
      const local = dice.globalToLocal(dir);
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
      nextOffset[xOrY][dim] += increment;
    });

    return nextOffset;
  }

  // Returns { nextBox, pivot, axis }
  // pivot and axis is in world frame.
  function roll(direction) {
    const nextOffset = getNextOffset(direction);

    const { newDice } = dice.roll(direction);
    const nextOrientation = {
      x: newDice.localToGlobal('FORWARD'),
      y: newDice.localToGlobal('LEFT'),
    };

    const nextBox = createBox({
      unitLength,
      dimension,
      offset: nextOffset,
      orientation: nextOrientation,
    });

    const dims = [ width, length, height ];
    let { axis, pivot } = dice.roll(direction);

    pivot = pivot.map((val, i) => val * dims[i]);
    pivot = new Vec3(...pivot);
    pivot = body.pointToWorldFrame(pivot);

    axis = new Vec3(...axis);
    axis = body.vectorToWorldFrame(axis);

    return { nextBox, pivot, axis };
  }

  // Returns a 2d array of unit coordinates and height
  // that describes the area under the box.
  // h is the number of unit cubes stacked in z direction.
  // Example:
  //   1) [ [{x: 0, y: 0, h: 1}], [{x: 1, y: 0, h: 1}] ]
  //      block[1][0] => {x: 1, y: 0, h: 1}
  //   2) [ [{x: 0, y: 0, h: 1}, {x: 0, y: 1, h: 1}] ]
  //      block[0][1] => {x: 0, y: 1, h: 1}
  //   3) [ [{x: 0, y: 0, h: 2}] ]
  //      block[0][0] => {x: 0, y: 0, h: 2}
  // Can only return a list of length 1 or 2.
  function getBlockUnder() {
    let x1InHalfUnit;
    let x2InHalfUnit;
    let y1InHalfUnit;
    let y2InHalfUnit;

    const { x, y, z } = getHalfUnitPosition();
    const h = z;

    const globalX = dice.globalToLocal('FORWARD');
    if (globalX === 'FORWARD' || globalX === 'BACKWARD') {
      x1InHalfUnit = x - nx;
      x2InHalfUnit = x + nx;
    } else if (globalX === 'LEFT' || globalX === 'RIGHT') {
      x1InHalfUnit = x - ny;
      x2InHalfUnit = x + ny;
    } else if (globalX === 'UP' || globalX === 'DOWN') {
      x1InHalfUnit = x - nz;
      x2InHalfUnit = x + nz;
    } else {
      throw new Error(`Invalid axis ${globalX}`);
    }

    const globalY = dice.globalToLocal('LEFT');
    if (globalY === 'FORWARD' || globalY === 'BACKWARD') {
      y1InHalfUnit = y - nx;
      y2InHalfUnit = y + nx;
    } else if (globalY === 'LEFT' || globalY === 'RIGHT') {
      y1InHalfUnit = y - ny;
      y2InHalfUnit = y + ny;
    } else if (globalY === 'UP' || globalY === 'DOWN') {
      y1InHalfUnit = y - nz;
      y2InHalfUnit = y + nz;
    } else {
      throw new Error(`Invalid axis ${globalY}`);
    }

    const x1 = 0.5 * (x1InHalfUnit + 1);
    const x2 = 0.5 * (x2InHalfUnit - 1);
    const y1 = 0.5 * (y1InHalfUnit + 1);
    const y2 = 0.5 * (y2InHalfUnit - 1);

    const block = [];
    for (let x = x1; x <= x2; ++x) {
      const column = [];
      for (let y = y1; y <= y2; ++y) {
        const tile = { x, y, h };
        column.push(tile);
      }
      block.push(column);
    }
    return block;
  }

  return {
    // TODO: move this out of box, so that box can go without unitLength.
    steadyBodyState: {
      position: body.position.clone(),
      quaternion: body.quaternion.clone(),
    },
    blockUnder: getBlockUnder(),

    roll,
  };
}
