import React from 'react';
import GameScene from './GameScene';
import * as store from '../store';

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
    store.dispatch({
      type: 'LOAD_STAGE',
      name: 'Level 0',
    });
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

    if (commandName === 'ROLL') {
      const direction = params[0];
      store.dispatch({
        type: 'ROLL',
        direction,
      });
    } else if (commandName === 'TOGGLE_PAUSE_RESUME') {
      store.dispatch({
        type: 'TOGGLE_PAUSE_RESUME',
      });
    }
  },

  _onStoreChange() {
    const state = store.getState();
    this.setState(state);
  },

  render() {
    return (
      <GameScene {...this.state} />
    );
  }
});

export default GameContainer;
