import React from 'react';

// Make a stateful component from PureComponent.
const wrapWithState = (state, PureComponent) => {
  const getDisplayName = (PureComponent) =>
    PureComponent.displayName || PureComponent.name || 'Component';
  const displayName = getDisplayName(PureComponent);

  return React.createClass({
    displayName: `Stateful(${displayName})`,
    getInitialState() { return state; },
    render() { return <PureComponent {...this.state} />; },
  });
};

export default wrapWithState;
