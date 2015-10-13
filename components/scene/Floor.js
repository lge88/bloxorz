import React, { Component, PropTypes } from 'react';
import { Object3D } from 'react-three';
import { Vector3, Quaternion } from 'three';
import Brick from './Brick';
import OrangeBrick from './OrangeBrick';
import RoundSwitch from './RoundSwitch';
import CrossSwitch from './CrossSwitch';
import Gate from './Gate';

const SHRINK = 0.99;

/* function tileKeyAtLocation({ x, y }) {
   return `tile_${x}_${y}`;
   } */

export default class Floor extends Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    thickness: PropTypes.number.isRequired,
    tiles: PropTypes.array.isRequired,
  };

  render() {
    const { width, thickness, tiles } = this.props;
    const brickWidth = SHRINK * width;

    const _tiles = Object.keys(tiles).map((key) => {
      const tile = tiles[key];
      const { type, position, quaternion } = tile;

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
      } else if (type === 'RoundSwitch') {
        return <RoundSwitch {...brickProps} />;
      } else if (type === 'CrossSwitch') {
        return <CrossSwitch {...brickProps} />;
      } else if (type === 'Gate') {
        return <Gate {...brickProps} />;
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
