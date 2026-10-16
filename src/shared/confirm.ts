/**
 * Confirmation before a record is saved or updated.
 *
 * Every create/save/update handler calls `confirmSave('<what>')` before it writes, so the user
 * always gets a confirmation on screen rather than a silent save. Outside a browser (unit tests,
 * server-side rendering) it returns true so existing behaviour and tests are unaffected.
 */
export function confirmSave(recordLabel: string): boolean {
  const message = `Save this ${recordLabel}?\n\nOK — save it now.\nCancel — go back without saving.`;
  if (typeof window === 'undefined' || typeof window.confirm !== 'function') return true;
  try {
    return window.confirm(message);
  } catch {
    // Some embedded webviews disable dialogs — never block a legitimate save on that.
    return true;
  }
}

/** Confirmation before a record is deleted. Returns true when the deletion should proceed. */
export function confirmDelete(recordLabel: string): boolean {
  const message = `Delete this ${recordLabel}?\n\nThis cannot be undone.\n\nOK — delete it.\nCancel — keep it.`;
  if (typeof window === 'undefined' || typeof window.confirm !== 'function') return true;
  try {
    return window.confirm(message);
  } catch {
    return true;
  }
}
