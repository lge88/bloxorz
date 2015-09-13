import React from 'react';
import GameScene from './components/GameScene';
import level0 from './stages/level-0.json';
import wrapWithState from './lib/wrapWithState';

var state = {
  tiles: level0.tiles,
  boxPosition: { x: 0, y: 0, z: 0.3 },
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

window.addEventListener('resize', () => {
  const { innerWidth: width, innerHeight: height } = window;
  gameScene.setState({ width, height });
});
