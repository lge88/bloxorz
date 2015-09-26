// The math model for rolling a box.

// x+ direction
export const FORWARD = 0;
// y+ direction
export const LEFT = 1;
// z+ direction
export const UP = 2;
// x- direction
export const BACKWARD = 3;
// y- direction
export const RIGHT = 4;
// z- direction
export const DOWN = 5;

export const createOrientation = (x, y, z) => {
  const orientation = Array(6);
  orientation[x] = FORWARD;
  orientation[5 - x] = 5 - FORWARD;
  orientation[y] = LEFT;
  orientation[5 - y] = 5 - LEFT;
  orientation[z] = UP;
  orientation[5 - z] = 5 - UP;
  return orientation;
};

const DIRECTIONS = [
  // x+ direction
  [ 1, 0, 0 ],
  // y+ direction
  [ 0, 1, 0 ],
  // z+ direction
  [ 0, 0, 1 ],
  // x- direction
  [ -1, 0, 0 ],
  // y- direction
  [ 0, -1, 0 ],
  // z- direction
  [ 0, 0, 1 ],
];

// Represented by two axis.
const EDGE_CENTERS = {
  // UP_FORWARD
  '0_2': [ 0.5, 0, 0.5 ],
  // UP_BACKWARD
  '2_3': [ -0.5, 0, 0.5 ],
  // UP_LEFT
  '1_2': [ 0, 0.5, 0.5 ],
  // UP_RIGHT
  '2_4': [ 0, -0.5, 0.5 ],

  // DOWN_FORWARD
  '0_5': [ 0.5, 0, -0.5 ],
  // DOWN_BACKWARD
  '3_5': [ -0.5, 0, -0.5 ],
  // DOWN_LEFT
  '1_5': [ 0, 0.5, -0.5 ],
  // DOWN_RIGHT
  '4_5': [ 0, -0.5, -0.5 ],

  // LEFT_FORWARD
  '0_1': [ 0.5, 0.5, 0 ],
  // LEFT_BACKWARD
  '1_3': [ -0.5, 0.5, 0 ],
  // RIGHT_FORWARD
  '0_4': [ 0.5, -0.5, 0 ],
  // RIGHT_BACKWARD
  '3_4': [ -0.5, -0.5, 0 ],
};

export const getEdgeCenter = (axis1, axis2) => {
  const ascendant = (a, b) => a > b;
  const edgeKey = [axis1, axis2].sort(ascendant).join('_');
  return EDGE_CENTERS[edgeKey];
};

// orientation is the local direction corresponds to the global direction.
// orientation[FORWARD] = UP means the local UP direction
// (direction of local z+) points to global FORWARD direction (x+).
// direction is the rolling direction. One of {'FORWARD','BACKWARD','LEFT','RIGHT'}
// returns { axis, pivot, point, force, newOrientation }
export const roll = (direction, orientation) => {
  const [
    OLD_FORWARD,
    OLD_LEFT,
    OLD_UP,
    OLD_BACKWARD,
    OLD_RIGHT,
    OLD_DOWN,
  ] = orientation;

  const newOrientation = Array(6);
  let axis;
  let pivot;
  let force;
  let point;

  switch (direction) {
  case 'FORWARD':
    newOrientation[FORWARD] = OLD_UP;
    newOrientation[LEFT] = OLD_LEFT;
    newOrientation[UP] = OLD_BACKWARD;
    newOrientation[BACKWARD] = OLD_DOWN;
    newOrientation[RIGHT] = OLD_RIGHT;
    newOrientation[DOWN] = OLD_FORWARD;

    axis = DIRECTIONS[OLD_LEFT];
    pivot = getEdgeCenter(OLD_FORWARD, OLD_DOWN);
    force = DIRECTIONS[OLD_FORWARD];
    point = getEdgeCenter(OLD_FORWARD, OLD_UP);
    break;
  case 'BACKWARD':
    newOrientation[FORWARD] = OLD_DOWN;
    newOrientation[LEFT] = OLD_LEFT;
    newOrientation[UP] = OLD_FORWARD;
    newOrientation[BACKWARD] = OLD_UP;
    newOrientation[RIGHT] = OLD_RIGHT;
    newOrientation[DOWN] = OLD_BACKWARD;

    axis = DIRECTIONS[OLD_RIGHT];
    pivot = getEdgeCenter(OLD_BACKWARD, OLD_DOWN);
    force = DIRECTIONS[OLD_BACKWARD];
    point = getEdgeCenter(OLD_BACKWARD, OLD_UP);
    break;
  case 'LEFT':
    newOrientation[FORWARD] = OLD_FORWARD;
    newOrientation[LEFT] = OLD_UP;
    newOrientation[UP] = OLD_RIGHT;
    newOrientation[BACKWARD] = OLD_BACKWARD;
    newOrientation[RIGHT] = OLD_DOWN;
    newOrientation[DOWN] = OLD_LEFT;

    axis = DIRECTIONS[OLD_BACKWARD];
    pivot = getEdgeCenter(OLD_LEFT, OLD_DOWN);
    force = DIRECTIONS[OLD_LEFT];
    point = getEdgeCenter(OLD_LEFT, OLD_UP);
    break;
  case 'RIGHT':
    newOrientation[FORWARD] = OLD_FORWARD;
    newOrientation[LEFT] = OLD_DOWN;
    newOrientation[UP] = OLD_LEFT;
    newOrientation[BACKWARD] = OLD_BACKWARD;
    newOrientation[RIGHT] = OLD_UP;
    newOrientation[DOWN] = OLD_RIGHT;

    axis = DIRECTIONS[OLD_FORWARD];
    pivot = getEdgeCenter(OLD_RIGHT, OLD_DOWN);
    force = DIRECTIONS[OLD_RIGHT];
    point = getEdgeCenter(OLD_RIGHT, OLD_UP);
    break;
  default:
    throw new Error('Invalid direction to roll ' + direction);
  }

  return { newOrientation, axis, pivot, force, point };
};

export const rollLeft = roll.bind(null, 'LEFT');
export const rollRight = roll.bind(null, 'RIGHT');
export const rollForward = roll.bind(null, 'FORWARD');
export const rollBackward = roll.bind(null, 'BACKWARD');
