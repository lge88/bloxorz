import React, { Component, PropTypes } from 'react';
import { Object3D } from 'react-three';
import { Vector3, Quaternion } from 'three';
import Brick from './Brick';
import OrangeBrick from './OrangeBrick';

const SHRINK = 0.95;

function tileKeyAtLocation({ x, y }) {
  return `tile_${x}_${y}`;
}

export default class Floor extends Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    thickness: PropTypes.number.isRequired,
    tiles: PropTypes.array.isRequired,
    dynamicTiles: PropTypes.object.isRequired,
  };

  render() {
    const { width, thickness, tiles, dynamicTiles } = this.props;
    const brickWidth = SHRINK * width;

    const _tiles = tiles.map((tile) => {
      const { x, y, type } = tile;
      const key = tileKeyAtLocation({ x, y });

      const position = new Vector3(width * x, width * y, -0.5 * thickness);
      const quaternion = new Quaternion(0, 0, 0, 1);

      const dynamicTile = dynamicTiles[key];
      if (typeof dynamicTile !== 'undefined') {
        position.copy(dynamicTile.position);
        quaternion.copy(dynamicTile.quaternion);
      }

      const brickProps = {
        key,
        width: brickWidth,
        thickness: thickness,
        position,
        quaternion,
      };

      if (type === 'Normal') {
        return <Brick {...brickProps} />;
      } else if (type === 'Fragile') {
        return <OrangeBrick {...brickProps} />;
      }

      return <Brick {...brickProps} />;
    });

    return (
      <Object3D>
        { _tiles }
      </Object3D>
    );
  }
}
