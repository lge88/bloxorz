import React, { Component, PropTypes } from 'react';
import { Object3D } from 'react-three';
import { Vector3 } from 'three';
import Brick from './brick';

export default class Floor extends Component {
  static propTypes = {
    tiles: PropTypes.array.isRequired
  };

  render() {
    const tiles = this.props.tiles.map((tile, i) => {
      const { x, y, type } = tile;
      const pos = new Vector3(0.1 * x, 0.1 * y, 0);
      if (type === 'Normal') {
        return <Brick key={i} position={pos} />;
      }

      return <Brick key={i} position={pos} />;
    });

    return (
      <Object3D>
        { tiles }
      </Object3D>

    );
  }
}
