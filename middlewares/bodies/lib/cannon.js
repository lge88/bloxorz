import { World, NaiveBroadphase } from 'cannon';
import { Body, Material } from 'cannon';
import { Plane, Box } from 'cannon';
import { Vec3, Quaternion } from 'cannon';
const { random } = Math;

const DEFAULT_MATERIAL = {
  friction: 1.0,
  restitution: 0.6,
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
  velocity = new Vec3(0, 0, 0),
  angularVelocity = new Vec3(0, 0, 0),
  mass = 5.0,
  material = { ...DEFAULT_MATERIAL },
  linearDamping = 0.5,
}) {
  const box = new Body({ mass });
  const { x, y, z } = dimension;
  box.addShape(new Box(new Vec3(0.5 * x, 0.5 * y, 0.5 * z)));
  box.position.copy(position);
  box.quaternion.copy(quaternion);
  box.velocity.copy(velocity);
  box.angularVelocity.copy(angularVelocity);
  box.material = new Material(material);
  box.linearDamping = linearDamping;
  return box;
}

export function createGround({
  material = { ...DEFAULT_MATERIAL },
}) {
  const ground = new Body({ mass: 0 });
  ground.addShape(new Plane());
  ground.material = new Material(material);
  return ground;
}

export function randomVec3() {
  return new Vec3(random(), random(), random());
}
