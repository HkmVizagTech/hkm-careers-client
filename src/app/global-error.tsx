'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#052057', marginBottom: '0.5rem' }}>Something went wrong</h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{error.message || 'An unexpected error occurred.'}</p>
            <button onClick={reset} style={{ backgroundColor: '#052057', color: '#fff', padding: '0.5rem 1.5rem', borderRadius: '0.75rem', border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>Try Again</button>
          </div>
        </div>
      </body>
    </html>
  );
}
