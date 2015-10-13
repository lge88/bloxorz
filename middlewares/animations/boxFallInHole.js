import freeFall from './lib/freeFall';

const DURATION = 500;

export default function createSimulation({
  position,
  quaternion,
  onEnd,
}) {
  const bodies = [
    { key: 'box', position, quaternion },
  ];

  return freeFall({
    bodies,
    duration: DURATION,
    onEnd,
  });
}
