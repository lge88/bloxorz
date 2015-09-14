import React, { Component } from 'react';
import { Mesh } from 'react-three';
import { BoxGeometry, MeshPhongMaterial, ImageUtils } from 'three';
import { FlatShading, Matrix4 } from 'three';
import BrickImage from '../images/brick.jpeg';

const texture = ImageUtils.loadTexture(BrickImage);
const material = new MeshPhongMaterial({
  map: texture,
  shading: FlatShading,
});
const geometry = new BoxGeometry(0.1, 0.1, 0.01);
const transZMatrix = (new Matrix4()).makeTranslation(0, 0, -0.005);
geometry.applyMatrix(transZMatrix);

export default class Box extends Component {
  render() {
    return (
      <Mesh {...{ geometry, material, ...this.props }} />
    );
  }
}
