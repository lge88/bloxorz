import React from 'react';
import GameScene from './components/GameScene';

var state = {
  width: window.innerWidth,
  height: window.innerHeight,
  lightIntensity: 1.0,
  cameraPosition: { x: 0.2, y: -0.5, z: 0.5 },
  boxPosition: { x: 0, y: 0, z: 0.3 },
  boxQuaternion: { x: 0, y: 0, z: 0, w: 1 },
};

const makeStateful = (state, Component) => {
  return React.createClass({
    displayName: 'StatefulWrapper',
    getInitialState() { return state; },
    render() { return <Component {...this.state} />; },
  });
};

const GameSceneWithState = makeStateful(state, GameScene);

window.gameScene = React.render(
  <GameSceneWithState />,
  document.getElementById('root')
);

window.addEventListener('resize', () => {
  const { innerWidth: width, innerHeight: height } = window;
  gameScene.setState({ width, height });
});
