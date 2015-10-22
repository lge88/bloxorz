import React, { PropTypes, Component } from 'react';
import { Mesh, Object3D } from 'react-three';
import { MeshPhongMaterial } from 'three';
import { Vector3 } from 'three';
import { Shape, ExtrudeGeometry } from 'three';
import Brick from './Brick';
const { PI } = Math;

const RADIUS = 0.45;
const THICKNESS = 0.2;
const COLOR = 0x888888;

const extrudeSettings = {
  amount: THICKNESS,
  steps: 2,
  bevelEnabled: false,
  // bevelSegments: 2,
  // bevelSize: 0.01,
  // bevelThickness: 0.05,
};

const shape = new Shape();
shape.absarc(0, 0, RADIUS, 0, PI * 2, false);

const geometry = new ExtrudeGeometry(shape, extrudeSettings);
const material = new MeshPhongMaterial({ color: COLOR });

const Switch = React.createClass({
  render() {
    return (
      <Mesh geometry={geometry}
            material={material}
            { ...this.props }
      />
    );
  },
});

export default class RoundSwitch extends Component {
  render() {
    const position = new Vector3(0, 0, 0.5);
    return (
      <Object3D {...this.props }>
        <Brick />
        <Switch position={position} />
      </Object3D>
    );
  }
}
