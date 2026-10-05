'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import type { ToastDetail } from '@/lib/toast';

interface Item extends ToastDetail {
  id: number;
}

const styles = {
  error: { icon: AlertCircle, cls: 'border-red-200 bg-red-50 text-red-800', iconCls: 'text-red-500' },
  success: { icon: CheckCircle, cls: 'border-emerald-200 bg-emerald-50 text-emerald-800', iconCls: 'text-emerald-500' },
  info: { icon: Info, cls: 'border-ocean/20 bg-white text-navy', iconCls: 'text-ocean' },
} as const;

/** Mount once per layout; shows toasts raised via `toast.error()` etc. */
export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let counter = 0;
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastDetail>).detail;
      const id = ++counter + Date.now();
      setItems((prev) => [...prev.slice(-3), { ...detail, id }]);
      setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 5000);
    };
    window.addEventListener('hkm-toast', onToast);
    return () => window.removeEventListener('hkm-toast', onToast);
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:items-end"
    >
      <AnimatePresence>
        {items.map((t) => {
          const s = styles[t.kind];
          const Icon = s.icon;
          return (
            <motion.div
              key={t.id}
              role={t.kind === 'error' ? 'alert' : 'status'}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 text-sm shadow-lift ${s.cls}`}
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${s.iconCls}`} />
              <p className="flex-1 leading-snug">{t.message}</p>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
                className="-m-1 rounded-lg p-1 opacity-60 transition-opacity hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
