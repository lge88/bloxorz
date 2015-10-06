import React, { PropTypes, Component } from 'react';
import { Mesh } from 'react-three';
import { BoxGeometry, MeshPhongMaterial, ImageUtils } from 'three';
import { FlatShading, Vector3 } from 'three';
import GateImage from '../../images/gate.jpeg';

const texture = ImageUtils.loadTexture(GateImage);
const material = new MeshPhongMaterial({
  map: texture,
  shading: FlatShading,
});

const geometry = new BoxGeometry(1, 1, 1);

export default class Brick extends Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    thickness: PropTypes.number.isRequired,
  };

  render() {
    const { width, thickness } = this.props;
    const scale = new Vector3(width, width, thickness);
    return (
      <Mesh {...{ geometry, material, scale, ...this.props }} />
    );
  }
}
