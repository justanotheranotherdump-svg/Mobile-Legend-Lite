// Historical training-fixture modal guard. The normal game uses the separate
// movement/combat policies below; its open panels do not block gameplay.
export function blocksGameplayInput(target, root = document) {
  return Boolean(
    root.querySelector("dialog[open]") ||
      target?.closest?.(
        'input,textarea,select,dialog,[contenteditable]:not([contenteditable="false"])',
      ),
  );
}

// WASD remains usable over menu buttons, radio/checkbox controls and selects.
// Real text/number entry is protected; movement must never steal typed letters.
export function blocksMovementInput(target) {
  return Boolean(
    target?.closest?.(
      'textarea,input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="range"]),[contenteditable]:not([contenteditable="false"])',
    ),
  );
}

// Non-modal panels do not block combat. Editing controls still own their keys.
export function blocksCombatInput(target) {
  return Boolean(
    target?.closest?.(
      'input,textarea,select,[contenteditable]:not([contenteditable="false"])',
    ),
  );
}
