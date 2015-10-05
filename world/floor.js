import { Body, Box, Vec3, Material } from 'cannon';
const { round, random } = Math;

function tileKeyAtLocation({ x, y }) {
  return `tile_${x}_${y}`;
}

export function createFloor({
  goal,
  width,
  thickness,
  tiles,
}) {
  const tileLUT = createTilesLUT(tiles);

  function createTilesLUT(tiles) {
    return tiles.reduce((lut, tile) => {
      const key = tileKeyAtLocation({ x: tile.x, y: tile.y });
      lut[key] = tile;
      return lut;
    }, {});
  }

  function xyToLocalFrame({ x, y }) {
    return { x: round(x / width), y: round(y / width) };
  }

  function xyToWorldFrame({ x, y }) {
    return { x: x * width, y: y * width };
  }

  function getTileAtLocation({ x, y }) {
    const key = tileKeyAtLocation({ x, y });
    const tile = tileLUT[key];
    if (typeof tile === 'undefined') {
      return null;
    }
    return tile;
  }

  // Return 2d array of local coords.
  // [ [{x: 0, y: 0}], [{x: 1, y: 0}] ]
  // block[1][0] => {x: 1, y: 0}
  // Can only return a list of length 1 or 2.
  function getBlockUnderBox(box) {
    const rect = box.getBox2OnXY();
    const { min, max } = rect;

    const locationMin = xyToLocalFrame({
      x: min.x + 0.5 * width,
      y: min.y + 0.5 * width,
    });

    const locationMax = xyToLocalFrame({
      x: max.x - 0.5 * width,
      y: max.y - 0.5 * width,
    });

    const [ x1, y1 ] = [ locationMin.x, locationMin.y ];
    const [ x2, y2 ] = [ locationMax.x, locationMax.y ];

    const block = [];
    for (let x = x1; x <= x2; ++x) {
      const column = [];
      for (let y = y1; y <= y2; ++y) {
        const tile = { x, y };
        column.push(tile);
      }
      block.push(column);
    }
    return block;
  }

  function shouldFallInHole(box) {
    const block = getBlockUnderBox(box);
    return block.length === 1 && block[0].length === 1 &&
      getTileAtLocation(block[0][0]) === null &&
      block[0][0].x === goal.x && block[0][0].y === goal.y;
  }

  // Only works for 1x1xn (n=1,2) types of boxes.
  function shouldFallOffEdge(box) {
    const rect = box.getBox2OnXY();
    const { min, max } = rect;

    const locationMin = xyToLocalFrame({
      x: min.x + 0.5 * width,
      y: min.y + 0.5 * width,
    });

    const locationMax = xyToLocalFrame({
      x: max.x - 0.5 * width,
      y: max.y - 0.5 * width,
    });

    const nx = (locationMax.x - locationMin.x + 1);
    const ny = (locationMax.y - locationMin.y + 1);

    // console.log('nx', nx, 'ny', ny);
    // console.assert(nx === 1 || ny === 1, 'nx or ny must be 1');

    if (nx === 1 && ny === 1) {
      return getTileAtLocation({ x: locationMin.x, y: locationMin.y }) === null;
    } else if (nx === 1 && ny === 2) {
      const [x, y1, y2, y0, y3] = [
        locationMin.x,
        locationMin.y,
        locationMax.y,
        locationMin.y - 1,
        locationMax.y + 1,
      ];

      const [ t0, t1, t2, t3 ] = [
        getTileAtLocation({ x, y: y0 }) === null,
        getTileAtLocation({ x, y: y1 }) === null,
        getTileAtLocation({ x, y: y2 }) === null,
        getTileAtLocation({ x, y: y3 }) === null,
      ];

      return (t1 && t2) || (t0 && t1) || (t2 && t3);
    } else if (nx === 2 && ny === 1) {
      const [x0, x1, x2, x3, y] = [
        locationMin.x - 1,
        locationMin.x,
        locationMax.x,
        locationMax.x + 1,
        locationMin.y,
      ];

      const [ t0, t1, t2, t3 ] = [
        getTileAtLocation({ x: x0, y }) === null,
        getTileAtLocation({ x: x1, y }) === null,
        getTileAtLocation({ x: x2, y }) === null,
        getTileAtLocation({ x: x3, y }) === null,
      ];
      return (t1 && t2) || (t0 && t1) || (t2 && t3);
    }

    throw new Error(`Cannot handle the case nx=${nx}, ny=${ny} :(`);
  }

  function shouldBreakFragileTile(box) {
    const block = getBlockUnderBox(box);

    if (block.length !== 1 || block[0].length !== 1) { return false; }

    const tile = getTileAtLocation(block[0][0]);
    return tile.type === 'Fragile';
  }

  function getPhysicalBricksUnderBox(box) {
    const block = getBlockUnderBox(box);
    const bricks = [];
    const hfT = 0.5 * thickness;
    const hfW = 0.5 * width;
    const shrink = 0.9;
    const material = new Material({
      friction: 0,
      restitution: 0,
    });

    block.forEach((row) => {
      row.forEach((xy) => {
        if (getTileAtLocation(xy) === null) { return; }

        const pos = xyToWorldFrame({ x: xy.x, y: xy.y });
        const brick = new Body({ mass: 0 });
        brick.material = material;

        // Shrink the brick a little bit to make it fall.
        const shape = new Box(new Vec3(shrink * hfW, shrink * hfW, hfT));
        brick.position.set(pos.x, pos.y, -hfT);
        brick.addShape(shape);
        brick._key = tileKeyAtLocation(xy);
        bricks.push(brick);
      });
    });
    return bricks;
  }

  function getPhysicalFragileBricksUnderBox(box) {
    // debugger;
    const block = getBlockUnderBox(box);
    const bricks = [];
    const hfT = 0.05;
    const hfW = 0.5 * width;
    const shrink = 0.9;
    const material = new Material({
      friction: 0,
      restitution: 0,
    });

    block.forEach((row) => {
      row.forEach((xy) => {
        if (getTileAtLocation(xy) === null) { return; }

        const pos = xyToWorldFrame({ x: xy.x, y: xy.y });
        const brick = new Body({ mass: 5 });
        brick.material = material;

        // Shrink the brick a little bit to make it fall.
        const shape = new Box(new Vec3(shrink * hfW, shrink * hfW, hfT));
        brick.position.set(pos.x, pos.y, -2 * hfT);

        let randomAngularVelocity = new Vec3(random(), random(), random());
        randomAngularVelocity.normalize();
        randomAngularVelocity = randomAngularVelocity.scale(10);

        brick.angularVelocity.copy(randomAngularVelocity);
        brick.addShape(shape);
        brick._key = tileKeyAtLocation(xy);
        bricks.push(brick);
      });
    });
    return bricks;
  }

  return {
    shouldFallInHole,
    shouldFallOffEdge,
    shouldBreakFragileTile,
    getPhysicalBricksUnderBox,
    getPhysicalFragileBricksUnderBox,
  };
}
