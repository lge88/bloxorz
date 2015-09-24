import React, { Component, PropTypes } from 'react';
import { Scene } from 'react-three';
import { Vector3, Quaternion } from 'three';
import Lights from './Lights';
import Camera from './Camera';
import Box from './Box';
import Floor from './Floor';

export default class GameScene extends Component {
  static propTypes = {
    box: PropTypes.shape({
      dimensions: PropTypes.shape({
        width: PropTypes.number.isRequired,
        numStories: PropTypes.number.isRequired,
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
      width: PropTypes.number.isRequired,
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

  render() {
    const { width, height } = this.props;
    const background = 0x999999;
    const camera = 'main';
    const sceneProps = {
      width,
      height,
      camera,
      background,
    };

    const { dimensions, position: boxPosition, quaternion: boxQuaternion } = this.props.box;
    const boxProps = {
      position: (new Vector3()).copy(boxPosition),
      quaternion: (new Quaternion()).copy(boxQuaternion),
      dimensions,
    };

    const floorProps = this.props.floor;

    const { position: cameraPosition } = this.props.camera;

    const { intensity: lightIntensity } = this.props.lights;

    return (
      <Scene { ...sceneProps }>
        <Box {...boxProps} />
        <Floor {...floorProps} />
        <Camera name = "main"
                aspect={width / height}
                position={cameraPosition}
        />
        <Lights lightIntensity={lightIntensity}/>
      </Scene>
    );
  }
}
