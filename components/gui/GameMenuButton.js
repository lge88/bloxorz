import React, { PropTypes } from 'react';

const GameMenuButton = React.createClass({
  propTypes: {
    onClick: PropTypes.func.isRequired,
  },

  render() {
    return (
      <button style={GameMenuButton.styles}
              onClick={this.props.onClick}>
        Main menu
      </button>
    );
  }
});

GameMenuButton.styles = {
  position: 'absolute',
  top: '12px',
  left: '12px',
  borderStyle: 'none',
  background: 'none',
  cursor: 'pointer',
  outline: 'none',
  fontFamily: 'PF Bague, Helvetica Neue, Helvetica, Arial, sans-serif',
  fontSize: '16px',
};

export default GameMenuButton;
