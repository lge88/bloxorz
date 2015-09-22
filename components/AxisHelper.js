import React, { Component } from 'react';
import { Object3D, Line } from 'react-three';
import { Geometry, Vector3, LineBasicMaterial } from 'three';

const axes = [
  // x+
  {
    color: 0xff0000,
    linewidth: 5,
    end: new Vector3(1, 0, 0),
  },
  // y+
  {
    color: 0x00ff00,
    linewidth: 5,
    end: new Vector3(0, 1, 0),
  },
  // z+
  {
    color: 0x0000ff,
    linewidth: 5,
    end: new Vector3(0, 0, 1),
  },
  // x-
  {
    color: 0xff0000,
    linewidth: 1,
    end: new Vector3(-1, 0, 0),
  },
  // y-
  {
    color: 0x00ff00,
    linewidth: 1,
    end: new Vector3(0, -1, 0),
  },
  // z-
  {
    color: 0x0000ff,
    linewidth: 1,
    end: new Vector3(0, 0, -1),
  },
].map((obj) => {
  const material = new LineBasicMaterial({
    color: obj.color,
    linewidth: obj.linewidth,
  });

  const geometry = new Geometry();
  geometry.vertices = [
    new Vector3(0, 0, 0),
    obj.end,
  ];

  return { geometry, material };
});

export default class AxisHelper extends Component {
  render() {
    return (
      <Object3D {...this.props}>
        { axes.map((a) => <Line {...a} />) }
      </Object3D>
    );
  }
}
