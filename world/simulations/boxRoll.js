import rotateWithHinge from './lib/rotateWithHinge';
const { PI } = Math;

const BOX_KEY = 'box';
const ANGLE = PI / 2;
const DURATION = 150;

export default function createSimulation({
  position,
  quaternion,
  axis,
  pivot,
  onEnd,
}) {
  return rotateWithHinge({
    key: BOX_KEY,
    position,
    quaternion,
    axis,
    pivot,
    angle: ANGLE,
    duration: DURATION,
    onEnd,
  });
}
