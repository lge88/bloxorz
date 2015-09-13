import React, { Component } from 'react';
import { Mesh } from 'react-three';
import { BoxGeometry, MeshPhongMaterial, ImageUtils } from 'three';
import { FlatShading, Matrix4 } from 'three';
import WoodImage from '../images/wood.jpeg';

export default class Box extends Component {
  render() {
    const geometry = new BoxGeometry(0.1, 0.1, 0.2);
    const transZMatrix = (new Matrix4()).makeTranslation(0, 0, 0.1);
    geometry.applyMatrix(transZMatrix);

    const texture = ImageUtils.loadTexture(WoodImage);

    const material = new MeshPhongMaterial({
      map: texture,
      shading: FlatShading,
    });

    return (
      <Mesh {...{ geometry, material, ...this.props }} />
    );
  }
}
