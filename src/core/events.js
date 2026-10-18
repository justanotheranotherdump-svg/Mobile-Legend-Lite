// Synchronous construction scope, no monkey-patching EventTarget/global APIs.
// Legacy direct-entry callers remain valid; managed runtimes abort all listeners.
let active = null;
export function withinEvents(controller, create) {
  const previous = active;
  active = controller;
  try {
    return create();
  } finally {
    active = previous;
  }
}
export function listen(target, type, callback, options) {
  const normalized =
    typeof options === "boolean" ? { capture: options } : { ...options };
  if (active) normalized.signal = active.signal;
  target.addEventListener(type, callback, normalized);
}
