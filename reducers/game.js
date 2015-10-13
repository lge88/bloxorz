import { tileKeyAtLocation, createNormalTile } from './tiles/normal';
import { createFragileTile } from './tiles/fragile';
import { createGateTile } from './tiles/gate';
import { createRoundSwitchTile, createCrossSwitchTile } from './tiles/switch';

function createTile(tile) {
  const type = tile.type;
  if (type === 'Normal') {
    return createNormalTile(tile);
  } else if (type === 'Fragile') {
    return createFragileTile(tile);
  } else if (type === 'RoundSwitch') {
    return createRoundSwitchTile(tile);
  } else if (type === 'CrossSwitch') {
    return createCrossSwitchTile(tile);
  } else if (type === 'Gate') {
    return createGateTile(tile);
  }

  console.warn(`Unknow tile type ${type}.`);
  return createNormalTile(tile);
}

function createTilesLUT(tiles) {
  const tilesLUT = tiles
          .map(createTile)
          .reduce((lut, tile) => {
            lut[tile.key] = tile;
            return lut;
          }, {});
  return tilesLUT;
}

export function initGame({ goal, box, tiles } ) {
  const tilesLUT = createTilesLUT(tiles);

  const gameState = {
    goal,
    tiles: tilesLUT,
    box: {
      dimension: box.dimension,
      offset: {
        x: [ 0, 0, 0 ],
        y: [ 0, 0, 0 ],
      },
      orientation: {
        x: 'FORWARD',
        y: 'LEFT',
      },
    }
  };

  return gameState;
}

// Returns { type, newState };
export function check() {

}
