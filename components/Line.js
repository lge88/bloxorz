import React, { PropTypes, Component } from 'react';
import { Line as Line_ } from 'react-three';
import { Geometry, LineBasicMaterial } from 'three';
import { Vector3 } from 'three';

export default class Line extends Component {
  static propTypes = {
    color: PropTypes.number.isRequired,
    linewidth: PropTypes.number.isRequired,
    start: PropTypes.object.isRequired,
    end: PropTypes.object.isRequired,
  };

  render() {
    const { color, linewidth, start, end } = this.props;

    const geometry = new Geometry();
    const p1 = (new Vector3()).copy(start);
    const p2 = (new Vector3()).copy(end);
    geometry.vertices.push(p1, p2);

    const material = new LineBasicMaterial({ color, linewidth });

    return (
      <Line_ {...{ geometry, material, ...this.props }}/>
    );
  }
}
