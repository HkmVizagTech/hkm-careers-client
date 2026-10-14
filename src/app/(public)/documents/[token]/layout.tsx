import type { Metadata } from 'next';

// Private upload links must never be indexed, and the token must not leak to other sites via Referer.
export const metadata: Metadata = {
  title: 'Upload your documents',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
