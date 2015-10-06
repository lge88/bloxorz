import React, { Component, PropTypes } from 'react';
import { OrthographicCamera } from 'react-three';
import { Vector3, Vector2, Box2 } from 'three';
const { min, max } = Math;

const DIRECTION = new Vector3(-1, -5, 3);
const UP = new Vector3(0, 0, 1);
const NEAR = -500;
const FAR = 1000;

function getAABB(gridSize, tiles) {
  const _min = { x: Infinity, y: Infinity };
  const _max = { x: -Infinity, y: -Infinity };

  for (let i = 0; i < tiles.length; ++i) {
    const tile = tiles[i];
    _min.x = min((tile.x - 0.5) * gridSize, _min.x);
    _max.x = max((tile.x + 0.5) * gridSize, _max.x);
    _min.y = min((tile.y - 0.5) * gridSize, _min.y);
    _max.y = max((tile.y + 0.5) * gridSize, _max.y);
  }

  return new Box2(new Vector2(_min.x, _min.y), new Vector2(_max.x, _max.y));
}

export default class Camera extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    gridSize: PropTypes.number.isRequired,
    tiles: PropTypes.array.isRequired,
    viewPort: PropTypes.object.isRequired,
  };

  render() {
    const { name, gridSize, tiles, viewPort } = this.props;
    const { width: w, height: h } = viewPort;

    const aabb = getAABB(gridSize, tiles);
    const center = aabb.center();
    const lookat = new Vector3(center.x, center.y, 0);
    const position = (new Vector3()).addVectors(lookat, DIRECTION);

    // TODO: s, left, right, top, bottom should be
    // computed from tiles
    // For now, it uses some magic numbers to make the scene looks reasonable.
    // Use a search approach to get proper s.
    const s = 0.0025;
    const left = s * w / - 2;
    const right = s * w / 2;
    const top = s * h / 2;
    const bottom = s * h / -2;

    return (
      <OrthographicCamera
        name = {name}
        left = {left}
        right = {right}
        top = {top}
        bottom = {bottom}
        near = {NEAR}
        far = {FAR}
        position = {position}
        lookat = {lookat}
        up = {UP}
      />
    );
  }
}
