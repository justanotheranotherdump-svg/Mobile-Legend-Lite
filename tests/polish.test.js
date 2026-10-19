import test from "node:test";
import assert from "node:assert/strict";
import {
  ProgressStore,
  progressKey,
  validateProgress,
} from "../src/menu/progress.js";
import {
  PreferenceStore,
  normalizePreferences,
  DEFAULT_PREFERENCES,
  PREFERENCES_KEY,
} from "../src/audio/preferences.js";
import { AudioEngine } from "../src/audio/engine.js";
import { SCORE, beatSeconds, midiFrequency } from "../src/audio/score.js";
const profile = { username: "Player_1" },
  memory = () => {
    const m = new Map();
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
  };
test("new and migrated profile receives 30000 / 0 and owned Layla once", () => {
  const s = memory(),
    a = new ProgressStore(s);
  assert.equal(a.loadFor(profile).coins, 30000);
  assert.equal(a.persistent, true);
  assert.deepEqual(a.snapshot().ownedHeroes, ["layla"]);
  assert.equal(a.snapshot().diamonds, 0);
  assert.equal(new ProgressStore(s).loadFor(profile).coins, 30000);
});
test("existing wallet never gains another starter grant", () => {
  const s = memory(),
    a = new ProgressStore(s);
  a.loadFor(profile);
  const v = { ...a.snapshot(), coins: 17, diamonds: 2 };
  s.setItem(progressKey(profile.username), JSON.stringify(v));
  assert.equal(new ProgressStore(s).loadFor(profile).coins, 17);
  assert.equal(new ProgressStore(s).loadFor(profile).diamonds, 2);
});
test("per-profile isolation, defensive snapshots and session caching", () => {
  const a = new ProgressStore(null);
  a.loadFor(profile);
  a.snapshot().ownedHeroes.push("fake");
  assert.deepEqual(a.snapshot().ownedHeroes, ["layla"]);
  assert.equal(a.persistent, false);
  a.loadFor({ username: "Other_2" });
  assert.equal(a.loadFor(profile).coins, 30000);
});
test("corrupt wallet recovers zero instead of regranting", () => {
  for (const raw of ["bad", "{}", '{"coins":-1}']) {
    const s = memory();
    s.setItem(progressKey(profile.username), raw);
    const a = new ProgressStore(s);
    assert.equal(a.loadFor(profile).coins, 0);
    assert.equal(a.recovered, true);
    assert.equal(new ProgressStore(s).loadFor(profile).coins, 0);
  }
});
test("wallet validates nonnegative safe integers and grant marker", () => {
  const valid = new ProgressStore(null).loadFor(profile);
  for (const value of [-1, Infinity, NaN, 1.5, Number.MAX_SAFE_INTEGER + 1])
    assert.equal(validateProgress({ ...valid, coins: value }), null);
  assert.equal(
    validateProgress({ ...valid, starterGrantApplied: false }),
    null,
  );
});
test("throwing and silently failing storage remains session-only", () => {
  for (const s of [
    {
      getItem() {
        throw Error("blocked");
      },
      setItem() {
        throw Error("blocked");
      },
    },
    {
      getItem() {
        return null;
      },
      setItem() {},
    },
  ]) {
    const a = new ProgressStore(s);
    assert.equal(a.loadFor(profile).coins, 30000);
    assert.equal(a.persistent, false);
    const p = new PreferenceStore(s);
    p.update({ masterMuted: true });
    assert.equal(p.value.masterMuted, true);
    assert.equal(p.persistent, false);
  }
});
test("audio preferences clamp numeric input and reject wrong types", () => {
  assert.deepEqual(normalizePreferences(null), DEFAULT_PREFERENCES);
  const p = normalizePreferences({
    masterVolume: 4,
    musicVolume: -3,
    effectsVolume: NaN,
    musicEnabled: "false",
  });
  assert.equal(p.masterVolume, 1);
  assert.equal(p.musicVolume, 0);
  assert.equal(p.effectsVolume, 0.6);
  assert.equal(p.musicEnabled, true);
});
test("preferences persist independently of wallet and support cleanup", () => {
  const s = memory(),
    p = new PreferenceStore(s);
  let calls = 0;
  const off = p.subscribe(() => calls++);
  p.update({ masterMuted: true, musicVolume: 0.2, reduceMotion: true });
  off();
  p.update({ effectsVolume: 0.1 });
  assert.equal(calls, 1);
  assert.equal(new PreferenceStore(s).value.musicVolume, 0.2);
  assert.equal(new PreferenceStore(s).value.reduceMotion, true);
  assert.ok(s.getItem(PREFERENCES_KEY));
  assert.equal(s.getItem(progressKey(profile.username)), null);
});
test("missing Web Audio is graceful and creates no scheduler", async () => {
  const a = new AudioEngine(new PreferenceStore(null), { Context: null });
  assert.equal(await a.unlock(), false);
  assert.equal(a.diagnostics().status, "unavailable");
  a.effect("shot");
  a.setScene("training");
  assert.equal(a.diagnostics().schedulerActive, false);
  a.dispose();
});
test("score contains eight complete bars and faster training arrangement", () => {
  assert.equal(SCORE.chords.length, 8);
  assert.equal(SCORE.melody.length, 64);
  assert.ok(beatSeconds("training") < beatSeconds("lobby"));
  assert.equal(midiFrequency(69), 440);
});

// Deterministic node graph/lifecycle checks; real synthesis is tested in Chromium.
function fakeContext() {
  const param = () => ({
    value: 1,
    setTargetAtTime(v) {
      this.value = v;
    },
    setValueAtTime(v) {
      this.value = v;
    },
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
  });
  const node = () => ({ connect() {}, disconnect() {}, gain: param() });
  return class Context {
    static instances = 0;
    constructor() {
      Context.instances++;
      this.currentTime = 0;
      this.state = "suspended";
      this.destination = node();
    }
    createGain() {
      return node();
    }
    createDynamicsCompressor() {
      return { ...node(), threshold: param(), ratio: param() };
    }
    createStereoPanner() {
      return { ...node(), pan: param() };
    }
    createOscillator() {
      return {
        ...node(),
        frequency: param(),
        start() {},
        stop(at) {
          if (at === undefined) this.onended?.();
        },
      };
    }
    async resume() {
      this.state = "running";
    }
    async suspend() {
      this.state = "suspended";
    }
    async close() {
      this.state = "closed";
    }
  };
}
test("audio graph uses one context/timer, true independent gains, no effects while muted", async () => {
  const Context = fakeContext(),
    p = new PreferenceStore(null),
    a = new AudioEngine(p, { Context });
  try {
    await a.unlock();
    const timer = a.timer;
    await a.unlock();
    assert.equal(Context.instances, 1);
    assert.equal(a.timer, timer);
    assert.ok(a.scheduledNotes > 0);
    p.update({ masterVolume: 0.3, musicVolume: 0.2, effectsVolume: 0.1 });
    assert.equal(a.master.gain.value, 0.3);
    assert.equal(a.music.gain.value, 0.2);
    assert.equal(a.effects.gain.value, 0.1);
    const fx = a.effectsPlayed;
    a.effect("shot");
    assert.equal(a.effectsPlayed, fx + 1);
    p.update({ effectsEnabled: false });
    assert.equal(a.effects.gain.value, 0);
    a.effect("shot");
    assert.equal(a.effectsPlayed, fx + 1);
    assert.ok(a.voices.size > 0);
    p.update({ masterMuted: true });
    assert.equal(a.master.gain.value, 0);
    assert.equal(a.voices.size, 0);
    const n = a.scheduledNotes;
    a.tick();
    assert.equal(a.scheduledNotes, n);
  } finally {
    a.dispose();
    assert.equal(a.timer, null);
    assert.equal(a.context.state, "closed");
  }
});
test("music switch leaves effects enabled; scene and visibility lifecycle stop old voices", async () => {
  const p = new PreferenceStore(null),
    a = new AudioEngine(p, { Context: fakeContext() });
  try {
    await a.unlock();
    p.update({ musicEnabled: false });
    assert.equal(a.music.gain.value, 0);
    assert.equal(a.effects.gain.value, 0.6);
    a.effect("skill");
    assert.equal(a.effectsPlayed, 1);
    p.update({ musicEnabled: true });
    a.setScene("training");
    assert.equal(a.scene, "training");
    assert.equal(a.beat, 0);
    a.tick();
    assert.ok(a.voices.size > 0);
    a.setHidden(true);
    assert.equal(a.timer, null);
    assert.equal(a.voices.size, 0);
    assert.equal(a.context.state, "suspended");
    a.effect("shot");
    assert.equal(a.effectsPlayed, 1);
    a.setHidden(false);
    await Promise.resolve();
    assert.equal(a.context.state, "running");
    assert.notEqual(a.timer, null);
  } finally {
    a.dispose();
  }
});
