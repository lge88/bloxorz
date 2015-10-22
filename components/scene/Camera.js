import React, { PropTypes } from 'react';
import { OrthographicCamera } from 'react-three';
import { Vector3, Vector2, Box3 } from 'three';
import { OrthographicCamera as OrthographicCamera_ } from 'three';
const { min, max, abs } = Math;

const UP = [ 0, 0, 1 ];
const NEAR = -500;
const FAR = 1000;

// Not a generic AABB algorithm, spefic to the game scene.
function getSceneAABB(bodies, boxHeight) {
  const _min = { x: Infinity, y: Infinity, z: boxHeight };
  const _max = { x: -Infinity, y: -Infinity, z: -boxHeight };

  Object.keys(bodies).forEach((key) => {
    const body = bodies[key];
    const { position, scale } = body;
    _min.x = min((position.x - 0.5 * scale.x), _min.x);
    _max.x = max((position.x + 0.5 * scale.x), _max.x);
    _min.y = min((position.y - 0.5 * scale.y), _min.y);
    _max.y = max((position.y + 0.5 * scale.y), _max.y);
  });

  return new Box3(
    new Vector3(_min.x, _min.y, _min.z),
    new Vector3(_max.x, _max.y, _max.z)
  );
}

function vectorToNDC(
  aVector,
  // orthographic camera properties:
  {
    position, up, lookat,
    near, far,
    left, right, top, bottom,
  },
) {
  const camera = new OrthographicCamera_(left, right, top, bottom, near, far);
  camera.position.copy(position);
  camera.up.copy(up);
  camera.lookAt(lookat);

  // MUST call update matrices manually!
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();

  const vector = (new Vector3()).copy(aVector);
  vector.project(camera);

  const ndc = new Vector2(vector.x, vector.y);
  return ndc;
}

function getAABBCorners(aabb) {
  return [
    // bottom
    new Vector3(aabb.min.x, aabb.min.y, aabb.min.z),
    new Vector3(aabb.max.x, aabb.min.y, aabb.min.z),
    new Vector3(aabb.max.x, aabb.max.y, aabb.min.z),
    new Vector3(aabb.min.x, aabb.max.y, aabb.min.z),

    // top
    new Vector3(aabb.min.x, aabb.min.y, aabb.max.z),
    new Vector3(aabb.max.x, aabb.min.y, aabb.max.z),
    new Vector3(aabb.max.x, aabb.max.y, aabb.max.z),
    new Vector3(aabb.min.x, aabb.max.y, aabb.max.z),
  ];
}

const Camera = React.createClass({
  propTypes: {
    name: PropTypes.string.isRequired,
    viewPort: PropTypes.object.isRequired,
    aabbScale: PropTypes.object.isRequired,
    direction: PropTypes.object.isRequired,
    bodies: PropTypes.object.isRequired,
  },

  render() {
    const { name, bodies, viewPort } = this.props;
    const boxHeight = (bodies.box_0 && bodies.box_0.scale.z) || 0.0;

    let { direction, aabbScale } = this.props;
    direction = (new Vector3()).copy(direction);
    aabbScale = (new Vector3()).copy(aabbScale);

    const aabb = getSceneAABB(bodies, boxHeight);
    const center = aabb.center();
    const newSize = (new Vector3()).multiplyVectors(aabb.size(), aabbScale);
    aabb.setFromCenterAndSize(center, newSize);

    const corners = getAABBCorners(aabb);

    const lookat = center.clone();
    const position = (new Vector3()).addVectors(center, direction);
    const up = new Vector3(...UP);
    const [ near, far ] = [ NEAR, FAR ];

    const { width, height } = viewPort;
    const [ hfW, hfH ] = [ 0.5 * width, 0.5 * height ];
    const [ left, right, top, bottom ] = [ -hfW, hfW, hfH, -hfH ];

    const cameraProps = {
      name,
      position, up, lookat,
      near, far,
      left, right, top, bottom
    };

    const cornerNDCs = corners.map((corner) => vectorToNDC(corner, cameraProps));

    const maxAbsNDC = cornerNDCs.reduce((sofar, ndc) => {
      return max(sofar, abs(ndc.x), abs(ndc.y));
    }, -Infinity);

    const scale = maxAbsNDC;

    Object.assign(cameraProps, {
      left: left * scale,
      right: right * scale,
      top: top * scale,
      bottom: bottom * scale,
    });

    return <OrthographicCamera {...cameraProps} />;
  }
});

export default Camera;
