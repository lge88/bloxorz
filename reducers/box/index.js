import { createDice } from './dice';

export const roll = require('./roll');

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
export function initBoxState({
  unitLength = 0.1,
  dimension = { x: 1, y: 1, z: 2 },
  offset = { x: [ 0, 0, 0 ], y: [ 0, 0, 0 ] },
  orientation = { x: 'FORWARD', y: 'LEFT' },
}) {
  const { x: nx, y: ny, z: nz } = dimension;
  const dice = createDice({ orientation });

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

  // Immutable box state:
  return {
    // Simple copied properties:
    unitLength,
    dimension,
    offset,
    orientation,

    // Computed properties:
    blockUnder: getBlockUnder(),
  };
}
