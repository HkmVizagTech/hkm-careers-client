export type ToastKind = 'error' | 'success' | 'info';
export interface ToastDetail {
  message: string;
  kind: ToastKind;
}

function emit(message: string, kind: ToastKind) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ToastDetail>('hkm-toast', { detail: { message, kind } }));
}

/** Non-blocking replacement for window.alert(). Rendered by <Toaster />. */
export const toast = {
  error: (message: string) => emit(message, 'error'),
  success: (message: string) => emit(message, 'success'),
  info: (message: string) => emit(message, 'info'),
};
