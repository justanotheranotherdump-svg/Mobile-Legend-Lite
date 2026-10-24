import { MatchSimulation } from "./simulation.js";
import { LaneView } from "../rendering/lane-view.js";
import { createRuntime } from "../runtime.js";
export async function startMatch(options) {
  const simulation = new MatchSimulation(
    options.registry,
    options.config,
    options.profile,
  );
  await options.onProgress?.(
    3,
    `Lane, six objectives, ${simulation.bots.length + 1} hero actors and wave scheduler initialized`,
  );
  return createRuntime({ ...options, simulation, View: LaneView });
}
