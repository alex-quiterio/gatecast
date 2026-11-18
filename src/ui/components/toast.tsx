import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
import { useCallback, useContext, useEffect, useRef, useState } from 'preact/hooks';

/** Show a transient message. */
export type ToastFn = (message: string) => void;

const ToastContext = createContext<ToastFn>(() => undefined);

/** The `toast(message)` function of the nearest {@link ToastProvider}. */
export function useToast(): ToastFn {
  return useContext(ToastContext);
}

/** Provides `useToast` and renders the live region that announces and shows toasts. */
export function ToastProvider({
  children,
  duration = 3200,
}: {
  children: ComponentChildren;
  duration?: number;
}) {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toast = useCallback<ToastFn>(
    (text) => {
      // Clear first so repeating the same text is announced again.
      setMessage('');
      clearTimeout(timer.current);
      queueMicrotask(() => setMessage(text));
      timer.current = setTimeout(() => setMessage(''), duration);
    },
    [duration],
  );
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div class="toast-region" role="status" aria-live="polite">
        {message ? <div class="toast">{message}</div> : null}
      </div>
    </ToastContext.Provider>
  );
}
