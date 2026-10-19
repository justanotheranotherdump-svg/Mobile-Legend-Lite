import { PROFILE_KEY } from "../menu/profile.js";
import { progressKey } from "../menu/progress.js";
import { battleAccountKey } from "../menu/battle-account.js";
import { buildKey } from "./builds.js";
import { historyKey } from "./history.js";
export const BACKUP_KEY = "moba-lab.reset-backup.v1";
export function accountKeys(name) {
  return [
    PROFILE_KEY,
    progressKey(name),
    battleAccountKey(name),
    buildKey(name),
    historyKey(name),
  ];
}
export function resetLocalAccount(storage, name) {
  if (!storage) return { ok: true, sessionOnly: true };
  let backup;
  try {
    backup = {
      version: 1,
      at: Date.now(),
      username: name,
      entries: accountKeys(name).map((k) => [k, storage.getItem(k)]),
    };
    storage.setItem(BACKUP_KEY, JSON.stringify(backup));
    if (storage.getItem(BACKUP_KEY) !== JSON.stringify(backup))
      throw Error("Backup verification failed");
    for (const k of accountKeys(name)) storage.removeItem(k);
    if (accountKeys(name).some((k) => storage.getItem(k) !== null))
      throw Error("Removal verification failed");
    return { ok: true };
  } catch (e) {
    try {
      for (const [k, v] of backup?.entries || [])
        if (v !== null) storage.setItem(k, v);
    } catch {}
    return {
      ok: false,
      error:
        "Local storage prevented a safe reset. No session data was cleared.",
    };
  }
}
export function restoreLocalBackup(storage) {
  try {
    const b = JSON.parse(storage?.getItem(BACKUP_KEY));
    if (
      b?.version !== 1 ||
      typeof b.username !== "string" ||
      !Array.isArray(b.entries)
    )
      return false;
    const allowed = accountKeys(b.username);
    if (
      b.entries.length !== allowed.length ||
      b.entries.some(
        ([k, v], n) =>
          k !== allowed[n] || (v !== null && typeof v !== "string"),
      )
    )
      return false;
    for (const [k, v] of b.entries) if (v !== null) storage.setItem(k, v);
    return b.entries.every(([k, v]) => v === null || storage.getItem(k) === v);
  } catch {
    return false;
  }
}
