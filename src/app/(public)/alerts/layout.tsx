import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job alerts',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function AlertsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
