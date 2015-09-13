import React, { Component, PropTypes } from 'react';
import { PerspectiveCamera } from 'react-three';
import { Vector3 } from 'three';

export default class Camera extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    aspect: PropTypes.number.isRequired,
    position: PropTypes.object.isRequired,
  };

  render() {
    const { name, position, aspect } = this.props;
    const _position = (new Vector3()).copy(position);
    const lookAt = _position.clone().negate();
    return (
      <PerspectiveCamera
        name = {name}
        fov = {75}
        aspect = {aspect}
        near = {0.001}
        far = {1000}
        position = {_position}

        /* It is `lookAt` in THREE's API. */
        lookat = {lookAt}
        up = {new Vector3(0, 0, 1)}
      />
    );
  }
}
