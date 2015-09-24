import React, { Component, PropTypes } from 'react';
import { Object3D } from 'react-three';
import { Vector3 } from 'three';
import Brick from './brick';

const SHRINK = 0.98;

export default class Floor extends Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    thickness: PropTypes.number.isRequired,
    tiles: PropTypes.array.isRequired,
  };

  render() {
    const { width, thickness, tiles } = this.props;
    const _tiles = tiles.map((tile, i) => {
      const { x, y, type } = tile;
      const pos = new Vector3(width * x, width * y, -0.5 * thickness);
      const brickWidth = SHRINK * width;
      if (type === 'Normal') {
        return <Brick key={i} width={brickWidth} thickness={thickness} position={pos} />;
      }

      return <Brick key={i} width={brickWidth} thickness={thickness} position={pos} />;
    });

    return (
      <Object3D>
        { _tiles }
      </Object3D>

    );
  }
}
