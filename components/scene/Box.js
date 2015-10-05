import React, { PropTypes, Component } from 'react';
import { Object3D, Mesh } from 'react-three';
import { BoxGeometry, MeshPhongMaterial, ImageUtils } from 'three';
import { FlatShading } from 'three';
import WoodImage from '../../images/wood.jpeg';
import AxisHelper from './AxisHelper';

const texture = ImageUtils.loadTexture(WoodImage);
const geometry = new BoxGeometry(1, 1, 1);
const material = new MeshPhongMaterial({
  map: texture,
  shading: FlatShading,
});

export default class Box extends Component {
  static propTypes = {
    debug: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    debug: true
  };

  render() {
    const { debug } = this.props;
    return (
      <Object3D {...this.props} >
        <Mesh {...{ geometry, material }} />
        { debug && <AxisHelper /> }
      </Object3D>
    );
  }
}
