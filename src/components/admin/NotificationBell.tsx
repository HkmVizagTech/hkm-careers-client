'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  BellRing,
  CalendarClock,
  CheckCheck,
  Clock,
  FileText,
  Hourglass,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/services';
import { timeAgo } from '@/lib/utils';
import type { AdminNotification, AdminNotificationType } from '@/types';

const POLL_MS = 30_000;

const TYPE_STYLE: Record<AdminNotificationType, { icon: LucideIcon; tone: string }> = {
  'new-application': { icon: FileText, tone: 'bg-ocean/10 text-ocean' },
  unreviewed: { icon: Hourglass, tone: 'bg-amber-100 text-amber-700' },
  interview: { icon: CalendarClock, tone: 'bg-plum/10 text-plum' },
  'job-closing': { icon: Clock, tone: 'bg-orange-100 text-orange-700' },
  'job-closed': { icon: Lock, tone: 'bg-gray-100 text-gray-600' },
  'follow-up': { icon: BellRing, tone: 'bg-teal/10 text-teal' },
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastUnread = useRef(0);

  // Light poll for the badge; the full list loads when the panel opens.
  const refreshCount = useCallback(async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const count = await getUnreadNotificationCount();
      setUnread(count);
      // New alerts arrived: update the tab title so it is noticed from another tab.
      if (count > lastUnread.current && typeof document !== 'undefined') {
        document.title = document.title.replace(/^\(\d+\)\s*/, '');
        document.title = `(${count}) ${document.title}`;
      }
      if (count === 0 && typeof document !== 'undefined') document.title = document.title.replace(/^\(\d+\)\s*/, '');
      lastUnread.current = count;
    } catch {
      /* offline or logged out: try again next tick */
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications(30);
      setItems(data.notifications);
      setUnread(data.unreadCount);
      lastUnread.current = data.unreadCount;
    } catch {
      /* keep what we have */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, POLL_MS);
    const onVisible = () => !document.hidden && refreshCount();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshCount]);

  useEffect(() => {
    if (open) loadList();
  }, [open, loadList]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openItem = async (n: AdminNotification) => {
    if (!n.read) {
      setItems((list) => list.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      markNotificationRead(n._id).catch(() => undefined);
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const readAll = async () => {
    setItems((list) => list.map((x) => ({ ...x, read: true })));
    setUnread(0);
    if (typeof document !== 'undefined') document.title = document.title.replace(/^\(\d+\)\s*/, '');
    try {
      await markAllNotificationsRead();
    } catch {
      loadList();
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-navy"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white"
            >
              {unread > 99 ? '99+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-2xl border border-hairline bg-white shadow-lift sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96"
          >
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <p className="text-sm font-bold text-navy">Notifications</p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={readAll}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-ocean transition-colors hover:bg-ocean/10"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[70vh] overflow-y-auto sm:max-h-[28rem]">
              {loading && items.length === 0 ? (
                <div className="space-y-3 p-4" aria-busy="true">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Bell className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-3 text-sm font-medium text-gray-700">You&apos;re all caught up</p>
                  <p className="mt-1 text-xs text-gray-500">New applications and reminders will show up here.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {items.map((n) => {
                    const style = TYPE_STYLE[n.type] || TYPE_STYLE['new-application'];
                    const Icon = style.icon;
                    return (
                      <li key={n._id}>
                        <button
                          type="button"
                          onClick={() => openItem(n)}
                          className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-ocean/[0.04] ${n.read ? '' : 'bg-ocean/[0.03]'}`}
                        >
                          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.tone}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block text-sm leading-snug ${n.read ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
                              {n.title}
                            </span>
                            {n.message && <span className="mt-0.5 block text-xs leading-snug text-gray-500">{n.message}</span>}
                            <span className="mt-1 block text-[11px] text-gray-400">{timeAgo(n.createdAt)}</span>
                          </span>
                          {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-ocean" aria-label="Unread" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
