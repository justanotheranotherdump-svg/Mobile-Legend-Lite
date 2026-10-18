import { scheduleBeat, beatSeconds, tone } from "./score.js";
export class AudioEngine {
  constructor(
    preferences,
    { Context = globalThis.AudioContext || globalThis.webkitAudioContext } = {},
  ) {
    this.preferences = preferences;
    this.Context = Context;
    this.context = null;
    this.status = Context ? "locked" : "unavailable";
    this.scene = "lobby";
    this.hidden = false;
    this.timer = null;
    this.voices = new Set();
    this.listeners = new Set();
    this.beat = 0;
    this.scheduledNotes = 0;
    this.effectsPlayed = 0;
    this.unsubscribe = preferences.subscribe(() => {
      this.apply();
      this.notify();
    });
  }
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  notify() {
    for (const fn of this.listeners) fn(this.diagnostics());
  }
  async unlock() {
    if (!this.Context) return false;
    try {
      if (!this.context) {
        const c = (this.context = new this.Context());
        this.master = c.createGain();
        this.music = c.createGain();
        this.effects = c.createGain();
        const compressor = c.createDynamicsCompressor();
        compressor.threshold.value = -12;
        compressor.ratio.value = 4;
        this.music.connect(this.master);
        this.effects.connect(this.master);
        this.master.connect(compressor);
        compressor.connect(c.destination);
        this.nextTime = c.currentTime + 0.05;
        this.context.onstatechange = () => {
          this.status = c.state === "running" ? "running" : "paused";
          this.notify();
        };
      }
      await this.context.resume();
      this.status = this.context.state === "running" ? "running" : "locked";
      this.apply();
      if (!this.hidden) this.startScheduler();
      this.notify();
      return this.status === "running";
    } catch {
      this.status = "locked";
      this.notify();
      return false;
    }
  }
  apply() {
    if (!this.context) return;
    const p = this.preferences.value,
      t = this.context.currentTime;
    this.master.gain.setTargetAtTime(
      p.masterMuted ? 0 : p.masterVolume,
      t,
      0.025,
    );
    this.music.gain.setTargetAtTime(
      p.musicEnabled ? p.musicVolume : 0,
      t,
      0.04,
    );
    this.effects.gain.setTargetAtTime(
      p.effectsEnabled ? p.effectsVolume : 0,
      t,
      0.025,
    );
    if (p.masterMuted || !p.musicEnabled || p.musicVolume === 0)
      this.stopVoices();
  }
  startScheduler() {
    if (this.timer !== null || !this.context) return;
    this.nextTime = this.context.currentTime + 0.05;
    this.tick();
    this.timer = setInterval(() => this.tick(), 80);
  }
  tick() {
    const c = this.context,
      p = this.preferences.value;
    if (
      !c ||
      c.state !== "running" ||
      this.hidden ||
      p.masterMuted ||
      !p.musicEnabled ||
      p.musicVolume === 0
    )
      return;
    if (this.nextTime < c.currentTime) this.nextTime = c.currentTime + 0.025;
    while (this.nextTime < c.currentTime + 0.2) {
      this.scheduledNotes += scheduleBeat(
        c,
        this.music,
        this.scene,
        this.beat,
        this.nextTime,
        this.voices,
      );
      this.nextTime += beatSeconds(this.scene);
      this.beat = (this.beat + 1) % 32;
    }
  }
  stopVoices() {
    for (const voice of this.voices)
      try {
        voice.stop();
      } catch {}
    this.voices.clear();
  }
  setScene(scene) {
    if (scene !== "lobby" && scene !== "training") return;
    if (scene !== this.scene) {
      this.stopVoices();
      this.scene = scene;
      this.beat = 0;
      if (this.context) this.nextTime = this.context.currentTime + 0.04;
      this.notify();
    }
  }
  setHidden(hidden) {
    this.hidden = hidden;
    if (hidden) {
      if (this.timer !== null) clearInterval(this.timer);
      this.timer = null;
      this.stopVoices();
      this.context?.suspend().catch(() => {});
    } else if (this.context) this.unlock();
  }
  effect(kind = "ui") {
    const c = this.context,
      p = this.preferences.value;
    if (
      !c ||
      c.state !== "running" ||
      this.hidden ||
      p.masterMuted ||
      !p.effectsEnabled ||
      p.effectsVolume === 0
    )
      return;
    this.effectsPlayed++;
    const now = c.currentTime;
    if (kind === "shot") {
      tone(c, this.effects, {
        note: 40,
        start: now,
        duration: 0.12,
        gain: 0.14,
        type: "triangle",
      });
      tone(c, this.effects, {
        note: 64,
        start: now,
        duration: 0.055,
        gain: 0.045,
        type: "sawtooth",
      });
    } else if (kind === "impact")
      tone(c, this.effects, {
        note: 57,
        start: now,
        duration: 0.09,
        gain: 0.08,
        type: "triangle",
      });
    else if (kind === "skill") {
      tone(c, this.effects, {
        note: 76,
        start: now,
        duration: 0.23,
        gain: 0.1,
      });
      tone(c, this.effects, {
        note: 83,
        start: now + 0.07,
        duration: 0.18,
        gain: 0.06,
      });
    } else
      tone(c, this.effects, {
        note: kind === "confirm" ? 81 : 76,
        start: now,
        duration: 0.1,
        gain: 0.055,
      });
  }
  diagnostics() {
    const p = this.preferences.value;
    return {
      status: this.status,
      contextState: this.context?.state || "not-created",
      scene: this.scene,
      scheduledNotes: this.scheduledNotes,
      effectsPlayed: this.effectsPlayed,
      activeMusicVoices: this.voices.size,
      schedulerActive: this.timer !== null,
      hidden: this.hidden,
      masterMuted: p.masterMuted,
      musicEnabled: p.musicEnabled,
      effectsEnabled: p.effectsEnabled,
      masterGain: this.master?.gain.value ?? 0,
      musicGain: this.music?.gain.value ?? 0,
    };
  }
  dispose() {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.stopVoices();
    this.unsubscribe();
    this.context?.close().catch(() => {});
    this.listeners.clear();
  }
}
