const data = [
  { name: 'Level 0', url: require('./stage0.json') },
];

// Debugging stages:
data.push({
  name: 'Tiles',
  url: require('./tiles.json'),
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

const stages = {
  data,
  findByName,
  findByIndex,
};

export default stages;
