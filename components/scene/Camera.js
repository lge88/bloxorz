import React, { Component, PropTypes } from 'react';
import { PerspectiveCamera } from 'react-three';
import { OrthographicCamera } from 'react-three';
import { Vector3 } from 'three';

const up = new Vector3(0, 0, 1);

export default class Camera extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    aspect: PropTypes.number.isRequired,
    position: PropTypes.object.isRequired,
  };

  render() {
    const { name, position, aspect } = this.props;
    const _position = (new Vector3()).copy(position);
    /* const lookAt = _position.clone().negate(); */
    const lookAt = new Vector3(4 * 0.1, -1 * 0.1, 0);
    /* const lookAt = new Vector3(4 * 0.1, -1 * 0.1, 0); */
    const r = 0.001;
    // return (
    //   <OrthographicCamera
    //     name = {name}
    //     left={r * window.innerWidth / - 2}
    //     right={r * window.innerWidth / 2}
    //     top={r * window.innerHeight / 2}
    //     bottom={r * window.innerHeight / - 2}
    //     near = {-500}
    //     far = {1000}

    //     position = {_position}
    //     lookat = {lookAt}
    //     up = {up}
    //   />
    // );
    return (
      <PerspectiveCamera
        name = {name}
        fov = {15}
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
