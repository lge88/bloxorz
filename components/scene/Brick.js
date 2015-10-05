import React, { PropTypes, Component } from 'react';
import { Mesh } from 'react-three';
import { BoxGeometry, MeshPhongMaterial, ImageUtils } from 'three';
import { FlatShading, Vector3 } from 'three';
import BrickImage from '../../images/brick.jpeg';

const texture = ImageUtils.loadTexture(BrickImage);
const material = new MeshPhongMaterial({
  map: texture,
  shading: FlatShading,
});

const geometry = new BoxGeometry(1, 1, 1);

export default class Box extends Component {
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
