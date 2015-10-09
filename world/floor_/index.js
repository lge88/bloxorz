import { tileKeyAtLocation, createNormalTile } from './tiles/normal';
import { createFragileTile } from './tiles/fragile';
import { createGateTile } from './tiles/gate';
import { createRoundSwitchTile, createCrossSwitchTile } from './tiles/switch';

const THICKNESS_RATIO = 0.15;

export const EVENT_TYPES = {
  NOTHING: 'NOTHING',
  FALL_IN_HOLE: 'FALL_IN_HOLE',
  FALL_OFF_EDGE: 'FALL_OFF_EDGE',
  BREAK_FRAGILE_TILES: 'BREAK_FRAGILE_TILES',
  TRIGGER_SWITCHES: 'TRIGGER_SWITCHES',
};

// TODO: No need for unitLength?
export function createFloor({
  goal,
  unitLength,
  tiles,
}) {
  const thickness = THICKNESS_RATIO * unitLength;
  const tileDimension = { x: unitLength, y: unitLength, z: thickness };

  const tileLUT = createTilesLUT(tiles);

  function createTilesLUT(tiles) {
    return tiles.reduce((lut, aTile) => {
      Object.assign(aTile, {
        dimension: tileDimension,
      });

      let tile;
      const type = aTile.type;
      if (type === 'Normal') {
        tile = createNormalTile(aTile);
      } else if (type === 'Fragile') {
        tile = createFragileTile(aTile);
      } else if (type === 'RoundSwitch') {
        tile = createRoundSwitchTile(aTile);
      } else if (type === 'CrossSwitch') {
        tile = createCrossSwitchTile(aTile);
      } else if (type === 'Gate') {
        tile = createGateTile(aTile);
      } else {
        console.warn(`Unknow tile type ${type}.`);
        tile = createNormalTile(aTile);
      }

      lut[tile.key] = tile;
      return lut;
    }, {});
  }

  function getTileAtLocation({ x, y }) {
    const key = tileKeyAtLocation({ x, y });
    const tile = tileLUT[key];
    if (typeof tile === 'undefined') {
      return null;
    }
    return tile;
  }

  function isSolid(xy) {
    const tile = getTileAtLocation(xy);

    if (tile === null) {
      return false;
    }

    if (tile.type === 'Gate' && tile.enabled === false) {
      return false;
    }

    return true;
  }

  function shouldFallInHole(block) {
    return block.length === 1 && block[0].length === 1 &&
      block[0][0].x === goal.x && block[0][0].y === goal.y;
  }

  function checkFallInHole(block) {
    const willHappen = shouldFallInHole(block);

    if (willHappen) {
      const eventData = {
        type: EVENT_TYPES.FALL_IN_HOLE,
        hole: { x: goal.x, y: goal.y },
      };
      return [ willHappen, eventData ];
    }

    return [ false, null ];
  }

  // Currently only works for 1x1xn (n=1,2) types of boxes.
  function shouldFallOffEdge(block) {
    const nx = block.length;
    const ny = block[0].length;
    const locationMin = block[0][0];
    const locationMax = block[nx - 1][ny - 1];

    if (nx === 1 && ny === 1) {
      return !isSolid({ x: locationMin.x, y: locationMin.y });
    } else if (nx === 1 && ny === 2) {
      const [x, y1, y2, y0, y3] = [
        locationMin.x,
        locationMin.y,
        locationMax.y,
        locationMin.y - 1,
        locationMax.y + 1,
      ];

      const [ t0, t1, t2, t3 ] = [
        !isSolid({ x, y: y0 }),
        !isSolid({ x, y: y1 }),
        !isSolid({ x, y: y2 }),
        !isSolid({ x, y: y3 }),
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
        !isSolid({ x: x0, y }),
        !isSolid({ x: x1, y }),
        !isSolid({ x: x2, y }),
        !isSolid({ x: x3, y }),
      ];
      return (t1 && t2) || (t0 && t1) || (t2 && t3);
    }

    throw new Error(`Currently cannot handle the case nx=${nx}, ny=${ny} :(`);
  }

  function getSolidTilesWithinBlock(block) {
    const tiles = [];
    block.forEach((row) => {
      row.forEach((xy) => {
        if (!isSolid(xy)) { return; }
        const tile = getTileAtLocation(xy);
        tiles.push(tile);
      });
    });
    return tiles;
  }

  function checkFallOffEdge(block) {
    const willHappen = shouldFallOffEdge(block);

    if (willHappen) {
      const eventData = {
        type: EVENT_TYPES.FALL_OFF_EDGE,
        solidTilesWithinBlock: getSolidTilesWithinBlock(block),
      };
      return [ willHappen, eventData ];
    }

    return [ false, null ];
  }

  function getBrokenTilesWithinBlock(block) {
    const tiles = [];
    block.forEach((row) => {
      row.forEach((xyh) => {
        const tile = getTileAtLocation(xyh);
        if (tile !== null && tile.type === 'Fragile') {
          const { h } = xyh;
          if (tile.shouldBreak({ h })) {
            tiles.push(tile);
          }
        }
      });
    });
    return tiles;
  }

  function checkBreakFragileTiles(block) {
    const fragileTiles = getBrokenTilesWithinBlock(block);
    const willHappen = fragileTiles.length > 0;

    if (willHappen) {
      const eventData = {
        type: EVENT_TYPES.BREAK_FRAGILE_TILES,
        fragileTiles,
      };
      return [ willHappen, eventData ];
    }

    return [ false, null ];
  }

  function getSwitchesWillTriggerWithinBlock(block) {
    const switches = [];
    block.forEach((row) => {
      row.forEach((xyh) => {
        const tile = getTileAtLocation(xyh);

        if (tile !== null && /Switch/.test(tile.type)) {
          const { h } = xyh;
          if (tile.shouldTrigger({ h })) {
            switches.push(tile);
          }
        }
      });
    });
    return switches;
  }

  function getGatesControlledBySwitches(switches) {
    const gates = switches.reduce((sofar, tile) => {
      if (tile !== null && /Switch/.test(tile.type)) {
        tile.gates.forEach((gate) => {
          const gateTile = getTileAtLocation({ x: gate.x, y: gate.y });
          if (gateTile !== null && gateTile.type === 'Gate') {
            sofar.push(gate);
          }
        });
      }
      return sofar;
    }, []);

    return gates;
  }

  function checkTriggerSwitch(block) {
    const switches = getSwitchesWillTriggerWithinBlock(block);
    const willHappen = switches.length > 0;

    if (willHappen) {
      const gates = getGatesControlledBySwitches(switches);
      const eventData = {
        type: EVENT_TYPES.TRIGGER_SWITCHES,
        switches,
        gates,
      };
      return [ willHappen, eventData ];
    }

    return [ false, null ];
  }

  // Returns a event object { type, ...data };
  function check(block) {
    let willHappen;
    let eventData;

    [ willHappen, eventData ] = checkFallInHole(block);
    if (willHappen) { return eventData; }

    [ willHappen, eventData ] = checkFallOffEdge(block);
    if (willHappen) { return eventData; }

    [ willHappen, eventData ] = checkBreakFragileTiles(block);
    if (willHappen) { return eventData; }

    [ willHappen, eventData ] = checkTriggerSwitch(block);
    if (willHappen) { return eventData; }

    return { type: EVENT_TYPES.NOTHING };
  }

  // TODO: returns a new floor instead?
  function triggerSwitches(aSwitches) {
    let switches = aSwitches.map(getTileAtLocation);
    switches = switches.filter((tile) => {
      return tile !== null && /Switch/.test(tile.type);
    });

    // trigger switches:
    switches.forEach((tile) => tile.trigger());

    // toggle gates:
    const gates = getGatesControlledBySwitches(switches);
    gates.forEach((tile) => tile.toggle());
  }

  return {
    // queries:
    check,

    // commands:
    triggerSwitches,
  };
}
