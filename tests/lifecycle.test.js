import test from "node:test";
import assert from "node:assert/strict";
import { withinEvents, listen } from "../src/core/events.js";
test("owned runtime event scope aborts its listeners without touching legacy or nested scopes", () => {
  const target = new EventTarget(),
    first = new AbortController(),
    second = new AbortController();
  const count = { legacy: 0, first: 0, second: 0 };
  listen(target, "tick", () => count.legacy++);
  withinEvents(first, () => {
    listen(target, "tick", () => count.first++);
    withinEvents(second, () => listen(target, "tick", () => count.second++));
  });
  target.dispatchEvent(new Event("tick"));
  assert.deepEqual(count, { legacy: 1, first: 1, second: 1 });
  first.abort();
  target.dispatchEvent(new Event("tick"));
  assert.deepEqual(count, { legacy: 2, first: 1, second: 2 });
  second.abort();
  target.dispatchEvent(new Event("tick"));
  assert.deepEqual(count, { legacy: 3, first: 1, second: 2 });
});
test("construction failures restore event scope instead of capturing future unrelated listeners", () => {
  const target = new EventTarget(),
    scope = new AbortController();
  let count = 0;
  assert.throws(() =>
    withinEvents(scope, () => {
      throw Error("failed");
    }),
  );
  listen(target, "tick", () => count++);
  scope.abort();
  target.dispatchEvent(new Event("tick"));
  assert.equal(count, 1);
});
