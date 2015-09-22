import React from 'react';
import GameScene from './components/GameScene';
import level0 from './stages/level-0.json';
import wrapWithState from './lib/wrapWithState';
import loop from './lib/loop';
import { createWorld } from './store/world';

var state = {
  tiles: level0.tiles,
  boxPosition: { x: 0, y: 0, z: 1 },
  boxQuaternion: { x: 0, y: 0, z: 0, w: 1 },

  width: window.innerWidth,
  height: window.innerHeight,
  lightIntensity: 1.0,
  cameraPosition: { x: 0.2, y: -0.5, z: 0.5 },
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

const world = createWorld({});
const updateWorld = () => {
  world.update();
  const { position, quaternion } = world.getBoxBodyState();
  Object.assign(state.boxPosition, position);
  Object.assign(state.boxQuaternion, quaternion);
  emitChange();
};
const handle = loop.add(updateWorld);

window.addEventListener('keydown', function(event) {
  switch (event.keyCode) {
  case 37: // Left
    world.rollBoxBackward();
    break;

  case 38: // Up
    world.rollBoxLeft();
    break;

  case 39: // Right
    world.rollBoxForward();
    break;

  case 40: // Down
    world.rollBoxRight();
    break;

  default:
    break;
  }
}, false);
