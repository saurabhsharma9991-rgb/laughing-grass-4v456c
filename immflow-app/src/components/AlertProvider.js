"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { registerAlerts } from "@/lib/client/alerts";

const AlertContext = createContext(null);

const TOAST_STYLES = {
  success: {
    box: "bg-green-light border-green-medium/30 text-green-dark",
    icon: "✓",
  },
  error: {
    box: "bg-red-light border-red/25 text-red",
    icon: "⚠",
  },
  info: {
    box: "bg-surface border-green-medium/25 text-text",
    icon: "ℹ",
  },
};

function ToastItem({ toast, onDismiss }) {
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 min-w-[280px] max-w-[min(420px,calc(100vw-2rem))] px-4 py-3.5 rounded-lg border shadow-lg backdrop-blur-sm animate-[toast-in_0.28s_ease-out] ${style.box}`}
    >
      <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white/60 text-sm font-semibold">
        {style.icon}
      </span>
      <p className="text-[13px] leading-snug flex-1 pt-0.5">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 bg-transparent border-none text-current opacity-60 hover:opacity-100 cursor-pointer text-lg leading-none p-0"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

function ConfirmModal({ state, onClose }) {
  if (!state) return null;

  const {
    title = "Please confirm",
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    danger = false,
    resolve,
  } = state;

  const finish = (value) => {
    resolve(value);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[2100] flex items-center justify-center backdrop-blur-xs p-4"
      onClick={() => finish(false)}
    >
      <div
        className="bg-white rounded-lg p-7 w-[420px] max-w-full shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-syne text-lg font-extrabold text-text mb-2" id="confirm-title">
          {title}
        </div>
        {message && (
          <p className="text-sm text-muted leading-relaxed mb-6">{message}</p>
        )}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => finish(false)}
            className="py-2.5 px-4 rounded-lg border border-[rgba(0,0,0,0.12)] bg-transparent text-sm font-medium text-muted hover:text-text cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => finish(true)}
            className={`py-2.5 px-4 rounded-lg border-none text-sm font-semibold text-white cursor-pointer transition-colors ${
              danger
                ? "bg-red hover:opacity-90"
                : "bg-green hover:bg-green-dark"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AlertProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
      window.setTimeout(() => dismissToast(id), 5000);
    },
    [dismissToast]
  );

  const showConfirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  useEffect(() => {
    registerAlerts({ showToast, showConfirm });
    return () => registerAlerts(null);
  }, [showToast, showConfirm]);

  return (
    <AlertContext.Provider value={{ showToast, showConfirm }}>
      {children}
      <div
        className="fixed top-5 left-1/2 -translate-x-1/2 z-[2000] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return ctx;
}
