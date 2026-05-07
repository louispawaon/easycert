/**
 * Yield control back to the browser's event loop so it can paint pending
 * updates (progress bar, cancel button) and process user input. Used between
 * batch chunks to keep the UI responsive during heavy canvas work.
 *
 * `setTimeout(0)` is used over `requestIdleCallback` for cross-browser
 * consistency and predictable scheduling under load.
 */
export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
