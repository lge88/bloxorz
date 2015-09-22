import React, { Component } from 'react';
import { Object3D, Mesh } from 'react-three';
import { BoxGeometry, MeshPhongMaterial, ImageUtils } from 'three';
import { FlatShading, Vector3 } from 'three';
import WoodImage from '../images/wood.jpeg';
import AxisHelper from './AxisHelper';

const [ BOX_WIDTH, BOX_LENGTH, BOX_HEIGHT ] = [ 0.1, 0.1, 0.2 ];

const texture = ImageUtils.loadTexture(WoodImage);
const geometry = new BoxGeometry(1, 1, 1);
const material = new MeshPhongMaterial({
  map: texture,
  shading: FlatShading,
});
const scale = new Vector3(BOX_WIDTH, BOX_LENGTH, BOX_HEIGHT);

export default class Box extends Component {
  render() {
    return (
      <Object3D scale={scale} {...this.props} >
        <Mesh {...{ geometry, material }} />
        <AxisHelper />
      </Object3D>
    );
  }
}
