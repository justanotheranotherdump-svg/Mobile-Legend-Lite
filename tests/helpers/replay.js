// Deterministic behavior trace captured against the pre-refactor engine.
export function replayFoundation(sim) {
  const trace = [];
  const capture = () => trace.push(sim.snapshot());
  capture();
  sim.attack(); capture();
  sim.attack('dummy-a'); capture();
  sim.clearManualTarget();
  for (let i = 0; i < 55; i++) sim.update(1 / 60, 1, 0);
  capture();
  for (const mode of ['nearest', 'current-hp', 'hp-percent', 'manual']) {
    sim.setTargetMode(mode); sim.attack(); sim.attack(); capture(); sim.update(0.65);
  }
  sim.attack('dummy-c'); capture();
  for (let i = 0; i < 6; i++) { sim.update(0.65); sim.attack(); capture(); }
  sim.setTargetMode('current-hp');
  for (let i = 0; i < 20; i++) { sim.update(0.65); sim.attack(); capture(); }
  sim.reset(); capture();
  for (let i = 0; i < 150; i++) sim.update(1 / 60, 1, 1);
  capture();
  for (let i = 0; i < 600; i++) sim.update(1 / 60, -1, 0);
  capture();
  sim.reset(); capture();
  return trace;
}
