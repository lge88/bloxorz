import React, { PropTypes } from 'react';

const GameMenu = React.createClass({
  propTypes: {
    visible: PropTypes.bool.isRequired,
    stages: PropTypes.array.isRequired,
    loadStage: PropTypes.func.isRequired,
  },

  render() {
    const { stages, visible, loadStage } = this.props;
    const offsetY = visible ? 0 : 350;
    const stageLinks = stages.map((stage) => {
      const { name } = stage;
      return (
        <div>
          <button onClick={loadStage.bind(null, name)}>
            {name}
          </button>
        </div>
      );
    });

    const styles = Object.assign({}, GameMenu.styles, {
      transform: `translate(0px, ${offsetY}px)`
    });

    return (
      <div style={styles}>
        {stageLinks}
      </div>
    );
  }
});

GameMenu.styles = {
  position: 'absolute',
  bottom: '12px',
  left: '12px',
  right: '12px',
  height: '300px',
  transition: 'transform 0.2s',
  background: 'rgba(255,0,0,0.3)',
};

export default GameMenu;
