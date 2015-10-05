import React, { PropTypes } from 'react';

const GameStats = React.createClass({
  propTypes: {
    stageName: PropTypes.string.isRequired,
  },

  render() {
    const { stageName } = this.props;
    return (
      <div style={GameStats.styles}>
        {`Stage: ${stageName}`}
      </div>
    );
  }
});

GameStats.styles = {
  position: 'absolute',
  top: '12px',
  right: '12px',
  fontFamily: 'PF Bague, Helvetica Neue, Helvetica, Arial, sans-serif',
  fontWeight: '200',
};

export default GameStats;
