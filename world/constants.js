export const STATE = {
  INIT: 'INIT',
  FALLING_TO_FLOOR: 'FALLING_TO_FLOOR',
  STEADY: 'STEADY',
  ROLLING: 'ROLLING',
  FALLING_IN_HOLE: 'FALLING_IN_HOLE',
  FALLING_OFF_EDGE: 'FALLING_OFF_EDGE',
  FALLING_WITH_FRAGILE_TILE: 'FALLING_WITH_FRAGILE_TILE',
  WON: 'WON',
  LOST: 'LOST',
};

export const CONTROL_STATE = {
  NOOP: 'NOOP',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  FORWARD: 'FORWARD',
  BACKWARD: 'BACKWARD',
};

export const DEFAULT_MATERIAL = {
  friction: 1.0,
  restitution: 0.6
};

export const ROLLING_DURATION = 150;

export const ROLLING_EASING_TYPE = 'easeOut';
