import React, { Component, PropTypes } from 'react';
import { Scene } from 'react-three';
import { Vector3, Quaternion } from 'three';
import Lights from './scene/Lights';
import Camera from './scene/Camera';
/* import Box from './scene/Box';
   import Floor from './scene/Floor'; */
import Bodies from './scene/Bodies';

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
    }),

    floor: PropTypes.shape({
      thickness: PropTypes.number.isRequired,
    }),

    lights: PropTypes.shape({
      intensity: PropTypes.number.isRequired,
    }),

    camera: PropTypes.shape({
      aabbScale: PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
        z: PropTypes.number.isRequired,
      }),
      direction: PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
        z: PropTypes.number.isRequired,
      }),
    }),

    viewPort: PropTypes.shape({
      width: PropTypes.number.isRequired,
      height: PropTypes.number.isRequired,
    }),

    world: PropTypes.shape({
      tiles: PropTypes.array.isRequired,
      bodies: PropTypes.object,
    }),
  };

  _getSceneProps() {
    const { width, height } = this.props.viewPort;
    return {
      width,
      height,
      camera: CAMERA_NAME,
      background: SCENE_BACKGROUND_COLOR,
    };
  }

  _getCameraProps() {
    const { viewPort, world, camera } = this.props;
    const { aabbScale, direction } = camera;
    const bodies = (world && world.bodies) || {};

    return {
      name: CAMERA_NAME,
      bodies,
      viewPort,
      aabbScale,
      direction,
    };
  }

  _getLightsProps() {
    return this.props.lights;
  }

  _getBodiesProps() {
    const { world } = this.props;
    const bodies = (world && world.bodies) || {};
    return { bodies };
  }

  _getBoxProps() {
    const { gridSize } = this.props;
    const {
      debug,
      dimension,
    } = this.props.box;

    const {
      position,
      quaternion,
    } = this.props.world.bodies.box;

    return {
      debug,
      position: (new Vector3()).copy(position),
      quaternion: (new Quaternion()).copy(quaternion),
      scale: (new Vector3()).copy(dimension).multiplyScalar(gridSize),
    };
  }

  _getFloorProps() {
    const { gridSize } = this.props;
    const { thickness } = this.props.floor;
    /* const { tiles, bodies } = this.props.world; */
    const { tiles } = this.props.world.bodies;
    /* debugger; */
    /* const tiles = Object.keys(bodies)
       .filter((key) => /tile_/.test(key))
       .reduce((dict, key) => {
       const body = bodies[key];
       dict[key] = body;
       return dict;
       }, {}); */

    return {
      width: gridSize,
      thickness,
      tiles,
      // dynamicTiles,
    };
  }

  render() {
    const sceneProps = this._getSceneProps();
    const cameraProps = this._getCameraProps();
    /* const boxProps = this._getBoxProps();
       const floorProps = this._getFloorProps(); */
    const lightsProps = this._getLightsProps();
    const bodiesProps = this._getBodiesProps();

    return (
      <Scene { ...sceneProps }>
        <Bodies {...bodiesProps} />
        <Camera {...cameraProps} />
        <Lights {...lightsProps} />
      </Scene>
    );
  }
}
