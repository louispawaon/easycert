/**
 * Returns true when designer-wide shortcuts (Delete, Escape, etc.) should not run,
 * so typing and Radix overlays keep native behavior.
 */
export function shouldIgnoreDesignerKeyboardTarget(target: EventTarget | null): boolean {
  let el: Element | null =
    target instanceof Element ? target : target instanceof Node ? target.parentElement : null;

  for (; el; el = el.parentElement) {
    if (el instanceof HTMLElement && el.isContentEditable) return true;

    const tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;

    const role = el.getAttribute("role");
    if (role === "listbox" || role === "dialog") return true;

    if (el.hasAttribute("data-radix-select-content")) return true;
  }

  return false;
}
