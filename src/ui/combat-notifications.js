// These classifications prepare future events, but do not generate combat.
export function describeCombatEvent(event) {
  if (
    event.type !== "death" ||
    !event.actor ||
    !event.victim ||
    event.victim.hp !== 0
  )
    return null;
  const { actor, victim } = event;
  if (victim.kind === "training-dummy" && actor.kind === "player")
    return {
      title: "Target eliminated",
      detail: `${victim.name} · training target`,
      prominent: false,
      tone: "training",
    };
  if (!["hero","player"].includes(victim.kind)) return null;
  if (victim.kind === "player" && actor.team === "enemy")
    return {
      title: "You have fallen",
      detail: `Defeated by ${actor.name}`,
      prominent: true,
      tone: "defeat",
    };
  if (actor.kind === "player" && victim.team === "enemy")
    return {
      title: "Enemy slain",
      detail: victim.name,
      prominent: true,
      tone: "victory",
    };
  if (["ally","player"].includes(actor.team) && victim.team === "enemy")
    return {
      title: "Ally eliminated an enemy",
      detail: `${actor.name} · ${victim.name}`,
      prominent: false,
      tone: "victory",
    };
  if (["ally","player"].includes(victim.team) && actor.team === "enemy")
    return {
      title: "Ally has fallen",
      detail: victim.name,
      prominent: false,
      tone: "defeat",
    };
  return null;
}
export class NotificationQueue {
  constructor() {
    this.reset();
  }
  reset() {
    this.items = [];
    this.current = null;
    this.until = 0;
  }
  push(event) {
    const notice = describeCombatEvent(event);
    if (!notice) return;
    if (notice.prominent && this.current && !this.current.prominent)
      this.current = null;
    this.items.push(notice);
    this.items.sort((a, b) => Number(b.prominent) - Number(a.prominent));
    this.items.length = Math.min(6, this.items.length);
  }
  update(time) {
    if (this.current && time >= this.until) this.current = null;
    if (!this.current && this.items.length) {
      this.current = this.items.shift();
      this.until = time + (this.current.prominent ? 3.2 : 2.4);
    }
    return this.current;
  }
}
export class CombatNotifications {
  constructor(root, events) {
    this.root = root;
    this.queue = new NotificationQueue();
    this.previous = null;
    events.subscribe((event) => {
      if (event.type === "reset") {
        this.queue.reset();
        this.previous = null;
        root.hidden = true;
        root.replaceChildren();
      } else this.queue.push(event);
    });
  }
  update(time) {
    const notice = this.queue.update(time);
    if (notice === this.previous) return;
    this.previous = notice;
    this.root.hidden = !notice;
    this.root.replaceChildren();
    if (notice) {
      this.root.className = `combat-announcements ${notice.tone} ${notice.prominent ? "prominent" : "minor"}`;
      const title = document.createElement("strong"),
        detail = document.createElement("span");
      title.textContent = notice.title;
      detail.textContent = notice.detail;
      this.root.append(title, detail);
    }
  }
}
