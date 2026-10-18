import { SPELL_ART } from "../spells/art.js";
export class SpellHud {
  constructor(s) {
    this.s = s;
    const b = (this.button = document.getElementById("battle-spell"));
    b.disabled = false;
    b.dataset.controlKind = "functional";
    b.classList.remove("reserved");
    b.querySelector(".reserved-mark")?.remove();
    b.querySelector(".icon")?.remove();
    b.insertAdjacentHTML(
      "afterbegin",
      `<img class="utility-png" src="${SPELL_ART[s.spells.id]}" alt=""><span class="utility-state spell-cooldown"></span>`,
    );
    b.querySelector(".slot-label").textContent = s.spells.definition.name;
    const el = (this.status = document.createElement("div"));
    el.id = "battle-spell-status";
    el.innerHTML =
      '<span></span><label id="arrival-destination-label" hidden>Arrival destination <select id="arrival-destination"></select></label>';
    document.querySelector("#hud-root").append(el);
    el.querySelector("select").onchange = (e) => {
      s.spells.destinationId = e.target.value || null;
    };
    this.off = s.events.subscribe((e) => {
      if (e.type === "spell-feedback") {
        el.querySelector("span").textContent = e.message;
        this.until = s.time + 3;
      }
    });
  }
  update() {
    const s = this.s,
      b = this.button,
      spell = s.spells,
      snap = spell.snapshot(),
      q = spell.definition;
    const time = snap.remaining;
    b.querySelector(".spell-cooldown").textContent = time
      ? Math.ceil(time)
      : "";
    b.title = `${q.name} · ${time ? Math.ceil(time) + "s cooldown" : q.target === "direction" ? "tap for auto/forward; hold to aim" : "ready"} · ${q.ability}`;
    b.classList.toggle(
      "utility-active",
      Boolean(
        spell.channel ||
          spell.springs.length ||
          s.player.shields?.length ||
          Object.values(spell.active).some((v) =>
            typeof v === "number" ? v > s.time : v?.until > s.time,
          ),
      ),
    );
    if (!(this.until > s.time)) {
      const effects = Object.entries(spell.active)
        .filter(([k, v]) =>
          typeof v === "number" ? v > s.time : v?.until > s.time,
        )
        .map(
          ([k, v]) =>
            `${k} ${typeof v === "number" ? Math.max(0, v - s.time).toFixed(1) + "s" : v.charges + " hits"}`,
        );
      if (s.player.shields?.length)
        effects.push(
          "Shield " +
            Math.ceil(s.player.shields.reduce((n, x) => n + x.amount, 0)) +
            " · " +
            Math.max(
              0,
              ...s.player.shields.map((x) => x.until - s.time),
            ).toFixed(1) +
            "s",
        );
      if (spell.springs.length)
        effects.push(
          "Revitalize " +
            Math.max(0, ...spell.springs.map((x) => x.until - s.time)).toFixed(
              1,
            ) +
            "s",
        );
      if (spell.channel)
        effects.push(
          `Arrival ${Math.max(0, spell.channel.endsAt - s.time).toFixed(1)}s`,
        );
      this.status.querySelector("span").textContent = effects.join(" · ");
    }
    const label = this.status.querySelector("label");
    label.hidden = spell.id !== "arrival";
    if (spell.id === "arrival") {
      const targets = spell.destinations(),
        stamp = targets.map((a) => a.id + ":" + a.name).join();
      if (stamp !== this.stamp) {
        this.stamp = stamp;
        const select = label.querySelector("select");
        select.replaceChildren(
          new Option("Choose allied destination", ""),
          ...targets.map((a) => new Option(a.name, a.id)),
        );
        select.value = spell.destinationId || "";
      }
    }
  }
  dispose() {
    this.off();
    this.status.remove();
  }
}
