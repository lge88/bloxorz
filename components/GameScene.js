import React, { Component, PropTypes } from 'react';
import { Scene } from 'react-three';
import { Vector3, Quaternion } from 'three';
import Lights from './Lights';
import Camera from './Camera';
import Box from './Box';
import Floor from './Floor';

export default class GameScene extends Component {
  static propTypes = {
    boxPosition: PropTypes.object.isRequired,
    boxQuaternion: PropTypes.object.isRequired,
    tiles: PropTypes.array.isRequired,

    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    lightIntensity: PropTypes.number.isRequired,
    cameraPosition: PropTypes.object.isRequired,
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

    const { boxPosition, boxQuaternion } = this.props;
    const boxProps = {
      position: (new Vector3()).copy(boxPosition),
      quaternion: (new Quaternion()).copy(boxQuaternion),
    };

    const { tiles } = this.props;

    const { cameraPosition } = this.props;

    const { lightIntensity } = this.props;

    return (
      <Scene { ...sceneProps }>
        <Box {...boxProps} />
        <Floor tiles={tiles} />
        <Camera name = "main"
                aspect={width / height}
                position={cameraPosition}
        />
        <Lights lightIntensity={lightIntensity}/>
      </Scene>
    );
  }
}
