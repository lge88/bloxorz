import React, { PropTypes } from 'react';
import { Object3D } from 'react-three';
import { Vector3, Quaternion } from 'three';

import Brick from './Brick';
import Box from './Box';
import OrangeBrick from './OrangeBrick';
import RoundSwitch from './RoundSwitch';
import CrossSwitch from './CrossSwitch';
import Gate from './Gate';

const Bodies = React.createClass({
  propTypes: {
    bodies: PropTypes.object.isRequired,
  },

  render() {
    const { bodies } = this.props;

    const _bodies = Object.keys(bodies).map((key) => {
      const body = bodies[key];
      const { type } = body;

      body.scale = (new Vector3()).copy(body.scale);
      body.position = (new Vector3()).copy(body.position);
      body.quaternion = (new Quaternion()).copy(body.quaternion);

      switch (type) {
      case 'Box':
        return <Box {...body} />;

      case 'Fragile':
        return <OrangeBrick {...body} />;

      case 'RoundSwitch':
        return <RoundSwitch {...body} />;

      case 'CrossSwitch':
        return <CrossSwitch {...body} />;

      case 'Gate':
        return <Gate {...body} />;

      case 'Normal':
      default:
        return <Brick {...body} />;
      }
    });

    return <Object3D>{ _bodies }</Object3D>;
  }
});

export default Bodies;
