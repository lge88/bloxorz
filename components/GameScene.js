import React, { Component, PropTypes } from 'react';
import { Scene } from 'react-three';
import { Vector3, Quaternion } from 'three';
import Lights from './Lights';
import Camera from './Camera';
import Box from './Box';
import Floor from './Floor';

const SCENE_BACKGROUND_COLOR = 0x999999;
const CAMERA_NAME = 'main';

export default class GameScene extends Component {
  static propTypes = {
    gridSize: PropTypes.number.isRequired,

    box: PropTypes.shape({
      debug: PropTypes.bool.isRequired,
      dimension: PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
        z: PropTypes.number.isRequired,
      }),
      position: PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
        z: PropTypes.number.isRequired,
      }),
      quaternion: PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
        z: PropTypes.number.isRequired,
        w: PropTypes.number.isRequired,
      }),
    }),

    floor: PropTypes.shape({
      thickness: PropTypes.number.isRequired,
      tiles: PropTypes.array.isRequired,
    }),

    lights: PropTypes.shape({
      intensity: PropTypes.number.isRequired,
    }),

    camera: PropTypes.shape({
      position: PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
        z: PropTypes.number.isRequired,
      }),
    }),

    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  };

  _getSceneProps() {
    const { width, height } = this.props;
    return {
      width,
      height,
      camera: CAMERA_NAME,
      background: SCENE_BACKGROUND_COLOR,
    };
  }

  _getCameraProps() {
    const { width, height } = this.props;
    const { position } = this.props.camera;
    return {
      name: CAMERA_NAME,
      position,
      aspect: width / height,
    };
  }

  _getLightsProps() {
    return this.props.lights;
  }

  _getBoxProps() {
    const { gridSize } = this.props;
    const {
      debug,
      dimension,
      position,
      quaternion,
    } = this.props.box;

    return {
      debug,
      position: (new Vector3()).copy(position),
      quaternion: (new Quaternion()).copy(quaternion),
      scale: (new Vector3()).copy(dimension).multiplyScalar(gridSize),
    };
  }

  _getFloorProps() {
    const { gridSize } = this.props;
    const { thickness, tiles } = this.props.floor;
    return {
      width: gridSize,
      thickness,
      tiles,
    };
  }

  render() {
    const sceneProps = this._getSceneProps();
    const cameraProps = this._getCameraProps();
    const boxProps = this._getBoxProps();
    const floorProps = this._getFloorProps();
    const lightsProps = this._getLightsProps();

    return (
      <Scene { ...sceneProps }>
        <Box {...boxProps} />
        <Floor {...floorProps} />
        <Camera {...cameraProps} />
        <Lights {...lightsProps} />
      </Scene>
    );
  }
}
