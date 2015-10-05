import React, { Component, PropTypes } from 'react';
import { Object3D, PointLight } from 'react-three';
import { Vector3 } from 'three';

export default class Lights extends Component {
  static propTypes = {
    intensity: PropTypes.number.isRequired
  };

  static defaultProps = { intensity: 1.0 };

  render() {
    const i = this.props.intensity;
    return (
      <Object3D>
        <PointLight position = {new Vector3(-0.5, 2.0, 1.0)}
                    intensity = {0.6 * i} />
        <PointLight position = {new Vector3(2.5, 1.5, 1.5)}
                    intensity = {0.5 * i} />
        <PointLight position = {new Vector3(0, -1.0, 1.5)}
                    intensity = {0.8 * i} />
        <PointLight position = {new Vector3(0, 0, -3.5)}
                    intensity = {0.3 * i} />
      </Object3D>
    );
  }
}
