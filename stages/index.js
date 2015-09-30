const stages = {
  'Level 0': require('./stage0.json'),
};

// Debugging stages:
Object.assign(stages, {
  'Tiles': require('./tiles.json'),
});

export default stages;
