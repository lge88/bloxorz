import 'babel-core/polyfill';
import 'whatwg-fetch';

import React from 'react';
import Game from './components/Game';

window.game = React.render(
  <Game />,
  document.getElementById('root')
);
