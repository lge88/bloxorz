import React from 'react';
import GameScene from './components/GameScene';
import level0 from './stages/level-0.json';
import wrapWithState from './lib/wrapWithState';
import { World, Box, Body, Vec3 } from 'cannon';
import { Plane, NaiveBroadphase, Material } from 'cannon';

var state = {
  tiles: level0.tiles,
  boxPosition: { x: 0, y: 0, z: 1.0 },
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

function initCannon() {
  const world = new World();
  world.quatNormalizeSkip = 0;
  world.quatNormalizeFast = false;
  world.gravity.set(0, 0, -10);
  world.broadphase = new NaiveBroadphase();

  const material = new Material({ friction: 1.0, restitution: 0.6 });

  const mass = 5;
  const boxShape = new Box(new Vec3(0.05, 0.05, 0.1));
  const boxBody = new Body({ mass: mass });
  boxBody.addShape(boxShape);
  boxBody.position.set(0, 0, state.boxPosition.z);

  boxBody.material = material;
  boxBody.linearDamping = 0.5;

  const groundShape = new Plane();
  const groundBody = new Body({ mass: 0 });
  groundBody.addShape(groundShape);
  groundBody.material = material;

  world.add(boxBody);
  world.add(groundBody);

  return { world, boxBody, groundBody };
}

const { world, boxBody } = initCannon();

const dt = 1 / 60;
const updateWorld = () => {
  world.step(dt);
  Object.assign(state.boxPosition, boxBody.position);
  Object.assign(state.boxQuaternion, boxBody.quaternion);
  emitChange();
  requestAnimationFrame(updateWorld);
};
requestAnimationFrame(updateWorld);
