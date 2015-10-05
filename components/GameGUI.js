import React, { PropTypes } from 'react';

import GameMenuButton from './gui/GameMenuButton';
import GameMenu from './gui/GameMenu';
import GameStats from './gui/GameStats';

const GameGUI = React.createClass({
  propTypes: {
    currentStage: PropTypes.object,
    paused: PropTypes.bool.isRequired,
    togglePauseResume: PropTypes.func.isRequired,
    stages: PropTypes.object.isRequired,
    loadStage: PropTypes.func.isRequired,
  },

  render() {
    const { currentStage, paused, togglePauseResume } = this.props;
    const { stages, loadStage } = this.props;

    const stageName = (currentStage && currentStage.name) || 'N/A';
    return (
      <div style={GameGUI.styles}>
        <GameMenuButton onClick={togglePauseResume} />
        <GameStats stageName={stageName} />
        <GameMenu visible={paused} stages={stages} loadStage={loadStage} />
      </div>
    );
  }
});

GameGUI.styles = {
  position: 'absolute',
  top: '0px',
  left: '0px',
  width: '100%',
  height: '100%',
};

export default GameGUI;
