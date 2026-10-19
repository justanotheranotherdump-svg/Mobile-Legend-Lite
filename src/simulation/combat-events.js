// Presentation-neutral event transport; no rules, scoring or UI dependencies.
export class CombatEvents {
  constructor() {
    this.listeners = new Set();
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  emit(event) {
    const immutable = structuredClone(event);
    for (const key of ["actor", "victim"])
      if (immutable[key]) Object.freeze(immutable[key]);
    Object.freeze(immutable);
    for (const listener of this.listeners) {
      try {
        listener(immutable);
      } catch (error) {
        console.error("Combat-event subscriber failed", error);
      }
    }
  }
}
