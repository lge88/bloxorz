import * as fragile from './fragile';
import * as gate from './gate';
import * as switches from './switches';

export function createTile(aTile) {
  const key = `tile_${aTile.x}_${aTile.y}`;
  const type = aTile.type;
  const tile = Object.assign({}, aTile, { key });

  if (type === 'Normal') {
    return tile;
  } else if (type === 'Fragile') {
    return fragile.init(tile);
  } else if (/Switch/.test(type)) {
    return switches.init(tile);
  } else if (type === 'Gate') {
    return gate.init(tile);
  }

  console.warn(`Unknow tile type ${type}.`);
  return tile;
}

export function createTilesLUT(tiles) {
  const tilesLUT = tiles
          .map(createTile)
          .reduce((lut, tile) => {
            lut[tile.key] = tile;
            return lut;
          }, {});
  return tilesLUT;
}
