import React, { PropTypes, Component } from 'react';
import { Object3D, Mesh } from 'react-three';
import { BoxGeometry, MeshPhongMaterial, ImageUtils } from 'three';
import { FlatShading, Vector3 } from 'three';
import WoodImage from '../images/wood.jpeg';
import AxisHelper from './AxisHelper';

const texture = ImageUtils.loadTexture(WoodImage);
const geometry = new BoxGeometry(1, 1, 1);
const material = new MeshPhongMaterial({
  map: texture,
  shading: FlatShading,
});

export default class Box extends Component {
  static propTypes = {
    dimensions: PropTypes.shape({
      width: PropTypes.number.isRequired,
      numStories: PropTypes.number.isRequired,
    }),
  };

  render() {
    const { width, numStories } = this.props.dimensions;
    const scale = new Vector3(width, width, numStories * width);
    return (
      <Object3D scale={scale} {...this.props} >
        <Mesh {...{ geometry, material }} />
        <AxisHelper />
      </Object3D>
    );
  }
}
