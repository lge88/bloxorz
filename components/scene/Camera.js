import React, { PropTypes } from 'react';
import { OrthographicCamera } from 'react-three';
import { Vector3, Vector2, Box3 } from 'three';
import { OrthographicCamera as OrthographicCamera_ } from 'three';
const { min, max, abs } = Math;

const UP = [ 0, 0, 1 ];
const NEAR = -500;
const FAR = 1000;

function getSceneAABB(boxHeight, gridSize, tiles) {
  const _min = { x: Infinity, y: Infinity, z: -boxHeight };
  const _max = { x: -Infinity, y: -Infinity, z: boxHeight };

  for (let i = 0; i < tiles.length; ++i) {
    const tile = tiles[i];
    _min.x = min((tile.x - 0.5) * gridSize, _min.x);
    _max.x = max((tile.x + 0.5) * gridSize, _max.x);
    _min.y = min((tile.y - 0.5) * gridSize, _min.y);
    _max.y = max((tile.y + 0.5) * gridSize, _max.y);
  }

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
    gridSize: PropTypes.number.isRequired,
    tiles: PropTypes.array.isRequired,
    viewPort: PropTypes.object.isRequired,
    boxHeight: PropTypes.number.isRequired,
    aabbScale: PropTypes.object.isRequired,
    direction: PropTypes.object.isRequired,
  },

  render() {
    const { name, gridSize, tiles } = this.props;
    const { viewPort, boxHeight } = this.props;

    let { direction, aabbScale } = this.props;
    direction = (new Vector3()).copy(direction);
    aabbScale = (new Vector3()).copy(aabbScale);

    const aabb = getSceneAABB(boxHeight, gridSize, tiles);
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
