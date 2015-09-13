import React, { Component, PropTypes } from 'react';
import { Scene, PerspectiveCamera } from 'react-three';
import { Vector3 } from 'three';
import OrbitControls from '../lib/OrbitControls';
import Lights from './Lights';
import Box from './Box';
import Floor from './Floor';
import level0 from '../stages/level-0.json';

export default class BoxScene extends Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  };

  static defaultProps = {
    width: 500,
    height: 500,
  };

  state = {
    boxPosition: new Vector3(0, 0, 0)
  };

  render() {
    const { width, height } = this.props;
    const _camera = (
      <PerspectiveCamera
        name = "main"
        fov = {75}
        aspect = {width / height}
        near = {0.001}
        far = {1000}
        position = {new Vector3(0.4, -0.4, 0.5)}
        lookAt = {new Vector3(0, 0, 0)}
        up = {new Vector3(0, 0, 1)}
      />
    );

    const camera = 'main';
    const orbitControls = OrbitControls;
    const background = 0x999999;

    const tiles = level0.tiles;
    const sceneProps = {
      width,
      height,
      camera,
      background,
      orbitControls,
    };

    return (
      <Scene { ...sceneProps }>
        { _camera }
        <Box
          position = {this.state.boxPosition}
        />

        <Floor tiles={tiles} />
        <Lights />
      </Scene>
    );
  }
}
