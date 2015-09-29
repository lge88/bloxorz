import React from 'react';
import GameContainer from './components/GameContainer';

window.game = React.render(
  <GameContainer />,
  document.getElementById('root')
);
