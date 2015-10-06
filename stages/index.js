const data = [
  { name: 'Stage 01', url: require('./stage01.json') },
  { name: 'Stage 04', url: require('./stage04.json') },
];

// Debugging stages:
data.push({
  name: 'Debug',
  url: require('./debug.json'),
});

function findByName(name) {
  for (let i = 0; i < data.length; ++i) {
    if (data[i].name === name) return data[i];
  }
  return null;
}

function findByIndex(i) {
  return data[i] || null;
}

function getNextStage(name) {
  let i;
  for (i = 0; i < data.length; ++i) {
    if (data[i].name === name) { break; }
  }
  i = (i + 1) % data.length;
  return data[i].name;
}

const stages = {
  data,
  findByName,
  findByIndex,
  getNextStage,
};

export default stages;
