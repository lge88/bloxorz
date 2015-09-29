import React from 'react';
import GameScene from './components/GameScene';
import level0 from './stages/level-0.json';
import wrapWithState from './lib/wrapWithState';
import loop from './lib/loop';
import { createWorld } from './world';

var state = {
  goal: level0.goal,

  gridSize: 0.1,

  box: {
    debug: false,
    dimension: { x: 1, y: 1, z: 2 },
    position: { x: 0, y: 0, z: 1.2 },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
  },

  floor: {
    thickness: 0.03,
    tiles: level0.tiles,
  },

  lights: {
    intensity: 1.0,
  },

  camera: {
    position: { x: 2, y: -5, z: 5 },
  },

  width: window.innerWidth,
  height: window.innerHeight,
};

const GameSceneWithState = wrapWithState(state, GameScene);

window.gameScene = React.render(
  <GameSceneWithState />,
  document.getElementById('root')
);

function emitChange() {
  gameScene.setState(state);
}

window.addEventListener('resize', () => {
  const { innerWidth: width, innerHeight: height } = window;
  const newState = { ...state, ...{ width, height } };
  state = newState;
  emitChange();
});

const world = createWorld({
  goal: state.goal,
  gridSize: state.gridSize,
  boxOptions: {
    nx: state.box.dimension.x,
    ny: state.box.dimension.y,
    nz: state.box.dimension.z,
    initialHeight: state.box.position.z,
  },
  tiles: state.floor.tiles,
});

const updateWorld = () => {
  world.update();
  const { position, quaternion } = world.getBoxBodyState();
  Object.assign(state.box.position, position);
  Object.assign(state.box.quaternion, quaternion);
  emitChange();
};
const handle = loop.add(updateWorld);

window.addEventListener('keydown', function(event) {
  switch (event.keyCode) {
  case 37:
    console.log('left -> roll backward');
    world.rollBoxBackward();
    break;

  case 38:
    console.log('up -> roll left');
    world.rollBoxLeft();
    break;

  case 39:
    console.log('right -> roll forward');
    world.rollBoxForward();
    break;

  case 40:
    console.log('down -> roll right');
    world.rollBoxRight();
    break;

  default:
    break;
  }
}, false);
