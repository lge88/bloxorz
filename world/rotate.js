import { Body, Quaternion, Vec3 } from 'cannon';

// pivot, axis are in world frame.
export function rotateBody({ position, quaternion }, pivot, axis, angle) {
  const rotation = new Quaternion();
  rotation.setFromAxisAngle(axis, angle);

  const tmpFrame = new Body();
  tmpFrame.position.copy(pivot);
  const centroidInTmpFrame = tmpFrame.pointToLocalFrame(position);

  tmpFrame.quaternion.copy(rotation);

  const newPosition = tmpFrame.pointToWorldFrame(centroidInTmpFrame);
  const newQuaternion = rotation.mult(quaternion);

  return { position: newPosition, quaternion: newQuaternion };
}

// pivot, axis are in world frame.
// rate is in rad/second
export function rotateBodyWithRate(
  { position, quaternion },
  pivot,
  axis,
  angle,
  rate
) {
  const angularVelocity = (new Vec3()).copy(axis).scale(rate);
  const { position: newPosition, quaternion: newQuaternion } = rotateBody({ position, quaternion }, pivot, axis, angle);
  const r = newPosition.vsub(pivot);
  const velocity = angularVelocity.cross(r);
  return {
    position: newPosition,
    quaternion: newQuaternion,
    velocity,
    angularVelocity
  };
}
