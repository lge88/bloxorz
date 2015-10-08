import { World, NaiveBroadphase } from 'cannon';
import { Body, Material } from 'cannon';
import { Plane, Box } from 'cannon';
import { Vec3, Quaternion } from 'cannon';

export const DEFAULT_MATERIAL = {
  friction: 1.0,
  restitution: 0.6
};

export function createWorld({
  gravity = new Vec3(0, 0, -15),
}) {
  const world = new World();
  world.quatNormalizeSkip = 0;
  world.quatNormalizeFast = false;
  world.gravity.copy(gravity);
  world.broadphase = new NaiveBroadphase();
  return world;
}

export function createBox({
  dimension = new Vec3(1, 1, 1),
  position = new Vec3(0, 0, 0),
  quaternion = new Quaternion(0, 0, 0, 1),
}) {
  const box = new Body({ mass: 5.0 });
  const { x, y, z } = dimension;
  box.addShape(new Box(new Vec3(0.5 * x, 0.5 * y, 0.5 * z)));
  box.position.copy(position);
  box.quaternion.copy(quaternion);
  box.material = new Material(DEFAULT_MATERIAL);
  box.linearDamping = 0.5;
  return box;
}

export function createGround() {
  const ground = new Body({ mass: 0 });
  ground.addShape(new Plane());
  ground.material = new Material(DEFAULT_MATERIAL);
  return ground;
}
