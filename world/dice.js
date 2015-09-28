// Implements the logic of rolling a unit cube.

// x+ direction
const FORWARD = 0;
// y+ direction
const LEFT = 1;
// z+ direction
const UP = 2;
// x- direction
const BACKWARD = 3;
// y- direction
const RIGHT = 4;
// z- direction
const DOWN = 5;
// unknown
const UNKNOWN = -1;

const ORIENTATIONS = [
  // x+ direction
  { value: FORWARD, name: 'FORWARD', vector: [ 1, 0, 0 ] },
  // y+ direction
  { value: LEFT, name: 'LEFT', vector: [ 0, 1, 0 ] },
  // z+ direction
  { value: UP, name: 'UP', vector: [ 0, 0, 1 ] },
  // x- direction
  { value: BACKWARD, name: 'BACKWARD', vector: [ -1, 0, 0 ] },
  // y- direction
  { value: RIGHT, name: 'RIGHT', vector: [ 0, -1, 0 ] },
  // z- direction
  { value: DOWN, name: 'DOWN', vector: [ 0, 0, -1 ] },
];

const ORIENTATIONS_BY_NAME = ORIENTATIONS.reduce((dict, item) => {
  dict[item.name] = item;
  return dict;
}, {});

const cross = (u, v) => {
  const [ u1, u2, u3 ] = u;
  const [ v1, v2, v3 ] = v;
  return [
    u2 * v3 - u3 * v2,
    u3 * v1 - u1 * v3,
    u1 * v2 - u2 * v1,
  ];
};

const vectorToOrientation = (u) => {
  const [ u1, u2, u3 ] = u;
  for (let i = 0; i < 6; ++i) {
    const [ v1, v2, v3 ] = ORIENTATIONS[i].vector;
    if (u1 === v1 && u2 === v2 && u3 === v3) {
      return i;
    }
  }
  return UNKNOWN;
};

// Edge centers of a unit cube (of dimension [1,1,1]);
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

// orientation is uniquely defined by the orientation of local x axis and
// local y axis. There are 6 x 4 = 24 unique orientations for a dice.
export const createDice = ({
  orientation = { x: 'FORWARD', y: 'LEFT' },
}) => {
  let { x, y } = orientation;
  x = ORIENTATIONS_BY_NAME[x].value;
  y = ORIENTATIONS_BY_NAME[y].value;

  const [ vecX, vecY] = [
    ORIENTATIONS[x].vector,
    ORIENTATIONS[y].vector,
  ];
  const vecZ = cross(vecX, vecY);
  const z = vectorToOrientation(vecZ);

  if (z === UNKNOWN) {
    throw new Error('Invalid local x and local y orietation.');
  }

  const localToGlobalLUT = Array(6);
  localToGlobalLUT[FORWARD] = x;
  localToGlobalLUT[LEFT] = y;
  localToGlobalLUT[UP] = z;
  localToGlobalLUT[BACKWARD] = x + 3 > 5 ? x - 3 : x + 3;
  localToGlobalLUT[RIGHT] = y + 3 > 5 ? y - 3 : y + 3;
  localToGlobalLUT[DOWN] = z + 3 > 5 ? z - 3 : z + 3;

  const globalToLocalLUT = Array(6);
  localToGlobalLUT.forEach((global, local) => {
    globalToLocalLUT[global] = local;
  });

  const localToGlobal = (aOrientation) => {
    const local = ORIENTATIONS_BY_NAME[aOrientation].value;
    const global = localToGlobalLUT[local];
    if (typeof global === 'undefined') {
      throw new Error(`Invalid local orientation: ${aOrientation}.`);
    }
    return ORIENTATIONS[global].name;
  };

  const globalToLocal = (aOrientation) => {
    const global = ORIENTATIONS_BY_NAME[aOrientation].value;
    const local = globalToLocalLUT[global];
    if (typeof local === 'undefined') {
      throw new Error(`Invalid local orientation: ${aOrientation}.`);
    }
    return ORIENTATIONS[local].name;
  };

  // direction is the rolling direction. One of {'FORWARD','BACKWARD','LEFT','RIGHT'}
  // returns { axis, pivot, newCube }
  // axis is the direction of rotation axis in local frame in 3-element-array form.
  // pivot is a point on the ration axis in local frame in 3-element-array form.
  const roll = (direction) => {
    const [
      OLD_FORWARD,
      OLD_LEFT,
      OLD_UP,
      OLD_BACKWARD,
      OLD_RIGHT,
      OLD_DOWN,
    ] = globalToLocalLUT;

    const newGlobalToLocalLut = Array(6);
    let axis;
    let pivot;

    switch (direction) {
    case 'FORWARD':
      newGlobalToLocalLut[FORWARD] = OLD_UP;
      newGlobalToLocalLut[LEFT] = OLD_LEFT;
      newGlobalToLocalLut[UP] = OLD_BACKWARD;
      newGlobalToLocalLut[BACKWARD] = OLD_DOWN;
      newGlobalToLocalLut[RIGHT] = OLD_RIGHT;
      newGlobalToLocalLut[DOWN] = OLD_FORWARD;

      axis = ORIENTATIONS[OLD_LEFT].vector;
      pivot = getEdgeCenter(OLD_FORWARD, OLD_DOWN);
      break;
    case 'BACKWARD':
      newGlobalToLocalLut[FORWARD] = OLD_DOWN;
      newGlobalToLocalLut[LEFT] = OLD_LEFT;
      newGlobalToLocalLut[UP] = OLD_FORWARD;
      newGlobalToLocalLut[BACKWARD] = OLD_UP;
      newGlobalToLocalLut[RIGHT] = OLD_RIGHT;
      newGlobalToLocalLut[DOWN] = OLD_BACKWARD;

      axis = ORIENTATIONS[OLD_RIGHT].vector;
      pivot = getEdgeCenter(OLD_BACKWARD, OLD_DOWN);
      break;
    case 'LEFT':
      newGlobalToLocalLut[FORWARD] = OLD_FORWARD;
      newGlobalToLocalLut[LEFT] = OLD_UP;
      newGlobalToLocalLut[UP] = OLD_RIGHT;
      newGlobalToLocalLut[BACKWARD] = OLD_BACKWARD;
      newGlobalToLocalLut[RIGHT] = OLD_DOWN;
      newGlobalToLocalLut[DOWN] = OLD_LEFT;

      axis = ORIENTATIONS[OLD_BACKWARD].vector;
      pivot = getEdgeCenter(OLD_LEFT, OLD_DOWN);
      break;
    case 'RIGHT':
      newGlobalToLocalLut[FORWARD] = OLD_FORWARD;
      newGlobalToLocalLut[LEFT] = OLD_DOWN;
      newGlobalToLocalLut[UP] = OLD_LEFT;
      newGlobalToLocalLut[BACKWARD] = OLD_BACKWARD;
      newGlobalToLocalLut[RIGHT] = OLD_UP;
      newGlobalToLocalLut[DOWN] = OLD_RIGHT;

      axis = ORIENTATIONS[OLD_FORWARD].vector;
      pivot = getEdgeCenter(OLD_RIGHT, OLD_DOWN);
      break;
    default:
      throw new Error('Invalid direction to roll ' + direction);
    }

    const newLocalToGlobalLut = Array(6);
    newGlobalToLocalLut.forEach((local, global) => {
      newLocalToGlobalLut[local] = global;
    });

    const newDice = createDice({
      orientation: {
        x: ORIENTATIONS[newLocalToGlobalLut[FORWARD]].name,
        y: ORIENTATIONS[newLocalToGlobalLut[LEFT]].name,
      },
    });

    return { axis, pivot, newDice };
  };

  return {
    localToGlobal,
    globalToLocal,
    roll,
  };
};
