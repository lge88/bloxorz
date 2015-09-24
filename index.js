import React from 'react';
import GameScene from './components/GameScene';
import level0 from './stages/level-0.json';
import wrapWithState from './lib/wrapWithState';
import loop from './lib/loop';
import { createWorld } from './world';

var state = {
  box: {
    dimensions: {
      width: 0.1,
      numStories: 2,
    },
    position: { x: 0, y: 0, z: 1 },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
  },

  floor: {
    thickness: 0.01,
    width: 0.1,
    tiles: level0.tiles,
  },

  lights: {
    intensity: 1.0,
  },

  camera: {
    position: { x: 0.2, y: -0.5, z: 0.5 },
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
  box: state.box,
  floor: state.floor,
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
