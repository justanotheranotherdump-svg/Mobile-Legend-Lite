import "./ui/style.css";
import { loadHeroRegistry } from "./heroes/catalog.js";
import { startTraining } from "./gameplay.js";
import { startMenuApplication } from "./menu/application.js";

// Historical/direct regression entry points are explicit and diagnostics-only.
// Ordinary first launch always follows profile → lobby → modes → training.
const params = new URLSearchParams(location.search);
const regression =
  params.get("hero") === "training" ||
  (params.get("screen") === "training" && location.hash === "#diagnostics");
if (regression) {
  document.querySelector("#app").hidden = false;
  startTraining();
} else {
  try {
    startMenuApplication(loadHeroRegistry(), startTraining);
  } catch (cause) {
    console.error(cause);
    const error = document.querySelector("#error");
    document.querySelector("#app").hidden = false;
    error.hidden = false;
    error.textContent = `Could not initialize MOBA Lab: ${cause.message}`;
  }
}
