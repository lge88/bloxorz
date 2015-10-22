import { randomVec3 } from '../lib/cannon';
import freeFall from '../lib/freeFall';

const BOX_KEY = 'box';
const DURATION = 500;

export default function createSimulation({
  position,
  quaternion,
  fragileTiles,
  onEnd,
}) {
  const bodies = [
    {
      key: BOX_KEY,
      position,
      quaternion,
    }
  ];

  fragileTiles.forEach((tile) => {
    const { x, y, dimension, key } = tile;
    const position = {
      x: x * dimension.x,
      y: y * dimension.y,
      z: -0.5 * dimension.z,
    };

    const velocity = { x: 0, y: 0, z: -1 };

    let angularVelocity = randomVec3();
    angularVelocity.normalize();
    angularVelocity = angularVelocity.scale(10);

    bodies.push({
      key,
      position,
      velocity,
      angularVelocity,
    });
  });

  return freeFall({
    bodies,
    duration: DURATION,
    onEnd,
  });
}
