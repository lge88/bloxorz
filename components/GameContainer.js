import React from 'react';
import GameScene from './GameScene';
import GameGUI from './GameGUI';
import * as store from '../store';
import stages from '../stages';

const KEY_MAP = {
  37: 'ROLL:BACKWARD',
  38: 'ROLL:LEFT',
  39: 'ROLL:FORWARD',
  40: 'ROLL:RIGHT',
  32: 'TOGGLE_PAUSE_RESUME:',
};

const GameContainer = React.createClass({
  getInitialState() {
    return store.getState();
  },

  componentDidMount() {
    window.addEventListener('resize', this._onWindowResize);
    window.addEventListener('keydown', this._onKeyDown, false);
    store.addChangeListener(this._onStoreChange);

    this._loadStage('Level 0');
  },

  componentWillUnmount() {
    window.removeEventListener('resize', this._onWindowResize);
    window.removeEventListener('keydown', this._onKeyDown);
    store.removeChangeListener(this._onStoreChange);
  },

  _onWindowResize() {
    const { innerWidth: width, innerHeight: height } = window;
    store.dispatch({
      type: 'RESIZE',
      width,
      height,
    });
  },

  _onKeyDown(event) {
    const command = KEY_MAP[event.keyCode];
    if (!command) return;

    const [ commandName, ...params ] = command.split(':');
    console.log('command: ', commandName, ...params);
    event.preventDefault();

    if (commandName === 'ROLL') {
      const direction = params[0];
      store.dispatch({
        type: 'ROLL',
        direction,
      });
    } else if (commandName === 'TOGGLE_PAUSE_RESUME') {
      this._togglePauseResume();
    }
  },

  _onStoreChange() {
    const state = store.getState();
    this.setState(state);
  },

  _togglePauseResume() {
    store.dispatch({
      type: 'TOGGLE_PAUSE_RESUME',
    });
  },

  _loadStage(stageName) {
    store.dispatch({
      type: 'RESUME',
    });

    store.dispatch({
      type: 'LOAD_STAGE',
      name: stageName,
    });
  },

  _getGameGUIProps() {
    return {
      currentStage: this.state.world && this.state.world.stage,
      paused: this.state.paused,
      togglePauseResume: this._togglePauseResume,
      stages,
      loadStage: this._loadStage,
    };
  },

  _getGameSceneProps() {
    return this.state;
  },

  render() {
    return (
      <div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <GameGUI {...this._getGameGUIProps()} />
        </div>
        <GameScene {...this._getGameSceneProps()} />
      </div>
    );
  }
});

export default GameContainer;
