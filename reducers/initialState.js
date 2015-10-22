import stages from '../stages';

const initialState = {
  gridSize: 0.1,

  box: {
    debug: false,
    dimension: { x: 1, y: 1, z: 2 },
    initialHeight: 1.2,
  },

  tile: {
    width: 0.98,
    thickness: 0.20,
  },

  lights: {
    intensity: 1.0,
  },

  camera: {
    aabbScale: { x: 1.2, y: 1.2, z: 2.0 },
    direction: { x: -2, y: -5, z: 3 },
  },

  viewPort: {
    width: window.innerWidth,
    height: window.innerHeight,
  },


  // A list of stages: [ { name, url } ]
  stages: stages.data,

  // Current stage:
  stage: {
    loading: false,
    name: null,
    error: null,
  },

  // Game state:
  paused: false,
  game: null,
  // game: {
  //   // goal: { x: 6, y: -3 },
  //   goal: null,

  //   // A look up table from {x,y} to tile props:
  //   // tiles[-3][2] => {x: -3, y: 2, type: 'Normal'}
  //   tiles: null,

  //   // Enum VALID, WON, LOST:BREAK_FRAGILE_TILES, LOST:FALL_OFF_EDGE
  //   status: 'VALID',

  //   // box: {
  //   //   dimension: {
  //   //     x: 1,
  //   //     y: 1,
  //   //     z: 2,
  //   //   },
  //   //   offset: {
  //   //     x: [ 0, 0, 0 ],
  //   //     y: [ 0, 0, 0 ],
  //   //   },
  //   //   orientation: {
  //   //     x: 'FORWARD',
  //   //     y: 'LEFT',
  //   //   },
  //   // },
  //   box: null,
  // },

  // Physics simulation state:
  world: {
    bodies: {}
  },

  // world: {
  //   // Enum { FALLING_TO_FLOOR, FALLING_IN_HOLE, FALLING_OFF_EDGE }
  //   // Enum { STEADY, ROLLING }
  //   status: 'FALLING_TO_FLOOR',

  //   // A dictionary: string -> { position, quaternion }
  //   // key of tile is tile_{i}_{j}.
  //   bodies: {
  //     box: {
  //       position: { x: 0, y: 0, z: 1.2 },
  //       quaternion: { x: 0, y: 0, z: 0, w: 1 },
  //     },
  //     // 'tile_-1_-3': {
  //     //   position: { x: -0.1, y: -0.3, z: -0.0075 },
  //     //   quaternion: { x: 0, y: 0, z: 0, w: 1 },
  //     // }
  //   },
  // },
};

export default initialState;
