/** Imperative toast + confirm API (registered by AlertProvider). */

let handlers = null;

export function registerAlerts(next) {
  handlers = next;
}

export function toast(message, type = "info") {
  handlers?.showToast?.(message, type);
}

export function toastSuccess(message) {
  toast(message, "success");
}

export function toastError(message) {
  toast(message, "error");
}

export function toastInfo(message) {
  toast(message, "info");
}

/**
 * Styled confirmation dialog. Resolves true if confirmed.
 * @param {string | { title?: string, message?: string, confirmLabel?: string, cancelLabel?: string, danger?: boolean }} options
 */
export function confirmDialog(options) {
  const opts =
    typeof options === "string"
      ? { message: options }
      : options;

  if (handlers?.showConfirm) {
    return handlers.showConfirm(opts);
  }

  return Promise.resolve(window.confirm(opts.message || opts.title || "Are you sure?"));
}
