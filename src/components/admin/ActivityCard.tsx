'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlarmClock,
  CalendarClock,
  FileCheck2,
  History,
  Mail,
  MessageSquare,
  RefreshCcw,
  Send,
  type LucideIcon,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { ActivityEntry } from '@/types';

const ICON: Record<string, { icon: LucideIcon; cls: string }> = {
  applied: { icon: Send, cls: 'bg-ocean/10 text-ocean' },
  status: { icon: RefreshCcw, cls: 'bg-blue-100 text-blue-700' },
  interview: { icon: CalendarClock, cls: 'bg-plum/10 text-plum' },
  email: { icon: Mail, cls: 'bg-emerald-100 text-emerald-700' },
  note: { icon: MessageSquare, cls: 'bg-gray-100 text-gray-600' },
  'follow-up': { icon: AlarmClock, cls: 'bg-teal/10 text-teal' },
  documents: { icon: FileCheck2, cls: 'bg-amber-100 text-amber-700' },
};

const who = (a: ActivityEntry) => (typeof a.by === 'object' && a.by ? a.by.name : a.byName) || 'System';

/** "Who did what, when" on an application, newest first. */
export default function ActivityCard({ activity }: { activity: ActivityEntry[] }) {
  const [all, setAll] = useState(false);
  const list = [...activity].reverse();
  const shown = all ? list : list.slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-2xl border border-hairline bg-white p-5 shadow-soft sm:p-6"
    >
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
        <History className="h-5 w-5 text-ocean" /> Activity
      </h2>
      {list.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">
          Nothing recorded yet. Status changes, interviews, emails, notes and documents will show up here.
        </p>
      ) : (
        <ol className="relative mt-4 space-y-4 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-gray-200">
          {shown.map((a) => {
            const meta = ICON[a.type] || ICON.note;
            const Icon = meta.icon;
            return (
              <li key={a._id} className="relative flex gap-3">
                <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${meta.cls}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 pt-1">
                  <p className="text-sm text-gray-800 [overflow-wrap:anywhere]">{a.text}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    <span className="font-semibold text-gray-500">{who(a)}</span> · {formatDateTime(a.at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {list.length > 8 && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-4 text-xs font-semibold text-ocean hover:text-navy">
          {all ? 'Show less' : `Show all ${list.length}`}
        </button>
      )}
    </motion.div>
  );
}
