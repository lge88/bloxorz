import React, { PropTypes } from 'react';

const GameMenuButton = React.createClass({
  propTypes: {
    onClick: PropTypes.func.isRequired,
  },

  render() {
    return (
      <button style={{ position: 'absolute', top: '12px', left: '12px' }}
              onClick={this.props.onClick}>
        Main menu
      </button>
    );
  }
});

const GameStatus = React.createClass({
  propTypes: {
    stageName: PropTypes.string.isRequired,
  },

  render() {
    const { stageName } = this.props;
    return (
      <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
        {stageName}
      </div>
    );
  }
});

const GameMenu = React.createClass({
  propTypes: {
    visible: PropTypes.bool.isRequired,
    stages: PropTypes.object.isRequired,
    loadStage: PropTypes.func.isRequired,
  },

  render() {
    const { stages, visible, loadStage } = this.props;
    const offsetY = visible ? 0 : 350;
    const stageLinks = Object.keys(stages).map((stageName) => {
      return (
        <div>
          <button onClick={loadStage.bind(null, stageName)}>
            {stageName}
          </button>
        </div>
      );
    });

    return (
      <div style={{ position: 'absolute',
                    bottom: '12px', left: '12px', right: '12px',
                    height: '300px',
                    transform: `translate(0px, ${offsetY}px)`,
                    transition: 'transform 0.2s',
                    background: 'rgba(255,0,0,0.3)' }}>
        {stageLinks}
      </div>
    );
  }
});

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
      <div style={{ position: 'absolute', top: '0px', left: '0px', width: '100%', height: '100%' }}>
        <GameMenuButton onClick={togglePauseResume} />
        <GameStatus stageName={stageName} />
        <GameMenu visible={paused} stages={stages} loadStage={loadStage} />
      </div>
    );
  }
});

export default GameGUI;
