import { Body, Box, Vec3, Quaternion, Material } from 'cannon';
import { rotateBody } from './rotate';
const { round, random, PI } = Math;
import loop from '../lib/loop';
import now from 'performance-now';

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
      tile._state = getInitialTileState(tile);
      return lut;
    }, {});
  }

  function getInitialTileState(tile) {
    if (tile.type === 'Gate') {
      const hfT = 0.5 * thickness;
      const hfW = 0.5 * width;
      const xy = xyToWorldFrame({ x: tile.x, y: tile.y });

      const body = new Body();
      body.position.set(xy.x, xy.y, -hfT);
      body.quaternion.set(0, 0, 0, 1);

      let pivot;
      let axis;

      if (tile.axis === 'Right') {
        pivot = body.pointToWorldFrame(new Vec3(hfW, 0, -hfT));
        axis = new Vec3(0, -1, 0);
      } else if (tile.axis === 'Left') {
        pivot = body.pointToWorldFrame(new Vec3(-hfW, 0, -hfT));
        axis = new Vec3(0, 1, 0);
      }

      let angle = tile.enabled ? 0 : PI;
      const getBodyStateAtRotationAngle = (angle) => {
        return rotateBody(body, pivot, axis, angle);
      };

      const { position, quaternion } = getBodyStateAtRotationAngle(angle);

      const easing = (t) => t;

      const toggle = () => {
        const currentAngle = tile.enabled ? 0 : PI;
        const targetAngle = PI - currentAngle;
        const diff = targetAngle - currentAngle;
        tile.enabled = !(tile.enabled);

        const startedTime = now();
        const duration = 200;
        const h = loop.add(() => {
          const currentTime = now();
          const t = (currentTime - startedTime) / duration;
          if (t < 1) {
            angle = currentAngle + diff * easing(t);
            Object.assign(state, getBodyStateAtRotationAngle(angle));
          } else {
            angle = targetAngle;
            Object.assign(state, getBodyStateAtRotationAngle(angle));
            h.remove();
          }
        });
      };

      const _key = tileKeyAtLocation({ x: tile.x, y: tile.y });
      const state = { _key, toggle, position, quaternion };
      return state;
    }

    return null;
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
      // getTileAtLocation(block[0][0]) === null &&
      block[0][0].x === goal.x && block[0][0].y === goal.y;
  }

  function isTileEmpty(xy) {
    const tile = getTileAtLocation(xy);
    return tile === null ||
      (tile.type === 'Gate' && tile.enabled === false);
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
      return isTileEmpty({ x: locationMin.x, y: locationMin.y });
    } else if (nx === 1 && ny === 2) {
      const [x, y1, y2, y0, y3] = [
        locationMin.x,
        locationMin.y,
        locationMax.y,
        locationMin.y - 1,
        locationMax.y + 1,
      ];

      const [ t0, t1, t2, t3 ] = [
        isTileEmpty({ x, y: y0 }),
        isTileEmpty({ x, y: y1 }),
        isTileEmpty({ x, y: y2 }),
        isTileEmpty({ x, y: y3 }),
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
        isTileEmpty({ x: x0, y }),
        isTileEmpty({ x: x1, y }),
        isTileEmpty({ x: x2, y }),
        isTileEmpty({ x: x3, y }),
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

  function toggleGate(tile) {
    tile._state.toggle();
  }

  function maybeTriggerSwitch(box) {
    const block = getBlockUnderBox(box);

    // TODO: maybe make this more generic?
    const isTall = block.length === 1 && block[0].length === 1;

    block.forEach((row) => {
      row.forEach((xy) => {
        const tile = getTileAtLocation(xy);
        const shouldTrigger = (tile.type === 'RoundSwitch') ||
                              (tile.type === 'CrossSwitch' && isTall);
        if (shouldTrigger) {
          const gateTiles = tile.gates.map(getTileAtLocation);
          gateTiles.forEach(toggleGate);
        }
      });
    });
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
        if (isTileEmpty(xy)) { return; }

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
    const hfT = 0.5 * thickness;
    const hfW = 0.5 * width;
    const material = new Material({
      friction: 0,
      restitution: 0,
    });

    block.forEach((row) => {
      row.forEach((xy) => {
        const tile = getTileAtLocation(xy);
        if (tile.type !== 'Fragile') { return; }

        const pos = xyToWorldFrame({ x: xy.x, y: xy.y });
        const shape = new Box(new Vec3(hfW, hfW, hfT));
        let randomAngularVelocity = new Vec3(random(), random(), random());
        randomAngularVelocity.normalize();
        randomAngularVelocity = randomAngularVelocity.scale(10);

        const brick = new Body({ mass: 5 });
        brick._key = tileKeyAtLocation(xy);
        brick.material = material;
        brick.position.set(pos.x, pos.y, -hfT);
        brick.angularVelocity.copy(randomAngularVelocity);
        brick.addShape(shape);

        bricks.push(brick);
      });
    });
    return bricks;
  }

  function getGateSteadyBodyState(gate) {
    return gate._state;

    const hfT = 0.5 * thickness;
    const hfW = 0.5 * width;
    const xy = xyToWorldFrame({ x: gate.x, y: gate.y });

    const body = new Body();
    body.position.set(xy.x, xy.y, -hfT);
    body.quaternion.set(0, 0, 0, 1);

    let pivot;
    let axis;

    if (gate.axis === 'Right') {
      pivot = body.pointToWorldFrame(new Vec3(hfW, 0, -hfT));
      axis = new Vec3(0, -1, 0);
    } else if (gate.axis === 'Left') {
      pivot = body.pointToWorldFrame(new Vec3(-hfW, 0, -hfT));
      axis = new Vec3(0, 1, 0);
    }

    const { position, quaternion } = rotateBody(body, pivot, axis, PI);
    const _key = tileKeyAtLocation({ x: gate.x, y: gate.y });

    return { position, quaternion, _key };
  }

  function getBodies() {
    return tiles
      .filter((tile) => tile.type === 'Gate')
      .map((tile) => getGateSteadyBodyState(tile))
      .reduce((dict, body) => {
        dict[body._key] = body;
        return dict;
      }, {});
  }

  return {
    shouldFallInHole,
    shouldFallOffEdge,
    shouldBreakFragileTile,
    maybeTriggerSwitch,
    getBodies,
    getPhysicalBricksUnderBox,
    getPhysicalFragileBricksUnderBox,
  };
}
