// Movement is allowed over gameplay HUD buttons, never through menus/editors.
// The global modal check also covers events targeted outside the focused dialog.
export function blocksGameplayInput(target, root = document) {
  return Boolean(
    root.querySelector("dialog[open]") ||
      target?.closest?.(
        'input,textarea,select,dialog,[contenteditable]:not([contenteditable="false"])',
      ),
  );
}
