import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  usernameError,
  validateProfile,
  ProfileStore,
  PROFILE_KEY,
  COUNTRIES,
  GENDERS,
} from "../src/menu/profile.js";
import { MenuNavigation } from "../src/menu/navigation.js";
const valid = { username: "Local_Hero7", country: "PH", gender: "Female" };
const memory = () => ({
  data: new Map(),
  getItem(k) {
    return this.data.get(k) || null;
  },
  setItem(k, v) {
    this.data.set(k, v);
  },
});
test("username validation rejects empty, short, long and forbidden characters", () => {
  for (const n of [
    "",
    "   ",
    "abc",
    "a".repeat(21),
    "bad name",
    "Hero@1",
    "<svg>",
    "你好你好",
    "a\nbc",
  ])
    assert.ok(usernameError(n), n);
  for (const n of ["Hero", "a".repeat(20), " A_b9 "])
    assert.equal(usernameError(n), "", n);
});
test("valid profiles are normalized and copy only the three local fields", () => {
  assert.deepEqual(
    validateProfile({ ...valid, username: " Local_Hero7 ", fakeRank: 99 }),
    valid,
  );
});
test("only PH, US, JP and Male/Female are allowed", () => {
  assert.deepEqual(Object.keys(COUNTRIES), ["PH", "US", "JP"]);
  assert.deepEqual(GENDERS, ["Male", "Female"]);
  for (const p of [
    null,
    {},
    [],
    { ...valid, country: "CA" },
    { ...valid, country: "toString" },
    { ...valid, gender: "Other" },
    { ...valid, username: 42 },
  ])
    assert.equal(validateProfile(p), null);
});
test("profile save/read round trip is verified, not just an optimistic write", () => {
  const m = memory(),
    s = new ProfileStore(m);
  assert.equal(s.load(), null);
  assert.deepEqual(s.save(valid), valid);
  assert.equal(s.persistent, true);
  assert.deepEqual(new ProfileStore(m).load(), valid);
});
test("unavailable storage keeps a valid session profile without claiming persistence", () => {
  const s = new ProfileStore({
    getItem() {
      throw Error("denied");
    },
    setItem() {
      throw Error("denied");
    },
  });
  assert.equal(s.load(), null);
  s.save(valid);
  assert.deepEqual(s.profile, valid);
  assert.equal(s.persistent, false);
});
test("no storage and silent/no-op storage writes degrade gracefully", () => {
  for (const storage of [
    null,
    {
      getItem() {
        return null;
      },
      setItem() {},
    },
  ]) {
    const s = new ProfileStore(storage);
    s.save(valid);
    assert.equal(s.persistent, false);
    assert.deepEqual(s.profile, valid);
  }
});
test("malformed and invalid saved profiles return to creation safely", () => {
  for (const bad of [
    "oops",
    "null",
    "[]",
    "{}",
    JSON.stringify({ ...valid, country: "XX" }),
    JSON.stringify({ ...valid, username: "<img>" }),
  ]) {
    const m = memory();
    m.setItem(PROFILE_KEY, bad);
    const s = new ProfileStore(m);
    assert.equal(s.load(), null);
    assert.equal(s.persistent, false);
  }
});
test("invalid profile never overwrites stored data", () => {
  const m = memory(),
    s = new ProfileStore(m);
  s.save(valid);
  assert.throws(() => s.save({ ...valid, username: "x" }));
  assert.deepEqual(new ProfileStore(m).load(), valid);
});
test("first and returning navigation follow the exact front-end flow", () => {
  for (const returning of [false, true]) {
    const n = new MenuNavigation(returning);
    assert.equal(n.screen, returning ? "lobby" : "create");
    if (!returning) assert.equal(n.go("lobby"), true);
    assert.equal(n.go("modes"), true);
    assert.equal(n.go("lobby"), true);
    assert.equal(n.go("modes"), true);
    assert.equal(n.go("training"), true);
    assert.equal(n.go("training"), false);
    assert.equal(n.go("lobby"), false);
  }
});
test("navigation cannot jump past creation/lobby or launch placeholder modes", () => {
  const n = new MenuNavigation();
  for (const s of ["training", "modes", "ranked", "classic", "brawl"])
    assert.equal(n.go(s), false);
  n.go("lobby");
  assert.equal(n.go("training"), false);
  assert.equal(n.screen, "lobby");
});
test("supplied creation PNG preserves original alpha-bearing bytes and GLB stays immutable", async () => {
  const png = await readFile("src/assets/images/layla-creation.png");
  assert.equal(png.readUInt32BE(16), 1536);
  assert.equal(png.readUInt32BE(20), 1024);
  assert.equal(png[25], 6, "RGBA PNG, not flattened");
  assert.equal(
    createHash("sha256").update(png).digest("hex"),
    "bc2b258b61ddceb7aa9abe9a82c9ebe25d30b7ba91c6d3a58a57b4f15005fca1",
  );
  assert.equal(
    createHash("sha256")
      .update(await readFile("src/heroes/layla/assets/layla.glb"))
      .digest("hex"),
    "963a4902955cb8ad345c74eb63b76e602ade5247c2bd94544ce3000cba6edd51",
  );
});
