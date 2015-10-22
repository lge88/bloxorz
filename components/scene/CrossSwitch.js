import React, { PropTypes, Component } from 'react';
import { Mesh, Object3D } from 'react-three';
import { MeshPhongMaterial } from 'three';
import { Vector2, Vector3 } from 'three';
import { Shape, ExtrudeGeometry } from 'three';
import Brick from './Brick';
const { PI, cos } = Math;

const THICKNESS = 0.2;
const LEG_LENGTH = 0.55;
const LEG_THICKNESS = 0.20;
const COLOR = 0x888888;

const extrudeSettings = {
  amount: THICKNESS,
  steps: 2,
  bevelEnabled: false,
  // bevelSegments: 2,
  // bevelSize: 0.01,
  // bevelThickness: 0.05,
};

const cos45 = cos(PI / 4);
const legEndOffset = (0.5 * LEG_THICKNESS) / cos45;
const [ xmin, xmax ] = [ -LEG_LENGTH * cos45, LEG_LENGTH * cos45 ];
const [ ymin, ymax ] = [ -LEG_LENGTH * cos45, LEG_LENGTH * cos45 ];

const points = [
  // bottom right leg:
  new Vector2(0, legEndOffset),
  new Vector2(xmax - legEndOffset, ymax),
  new Vector2(xmax, ymax),
  new Vector2(xmax, ymax - legEndOffset),

  // top right leg:
  new Vector2(legEndOffset, 0),
  new Vector2(xmax, ymin + legEndOffset),
  new Vector2(xmax, ymin),
  new Vector2(xmax - legEndOffset, ymin),

  // top left leg:
  new Vector2(0, -legEndOffset),
  new Vector2(xmin + legEndOffset, ymin),
  new Vector2(xmin, ymin),
  new Vector2(xmin, ymin + legEndOffset),

  // bottom left leg:
  new Vector2(-legEndOffset, 0),
  new Vector2(xmin, ymax - legEndOffset),
  new Vector2(xmin, ymax),
  new Vector2(xmin + legEndOffset, ymax),

  new Vector2(0, legEndOffset),
];

const shape = new Shape(points);
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

export default class CrossSwitch extends Component {
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
