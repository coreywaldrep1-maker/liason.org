// Server component wrapper for the /reset segment.
// Holds metadata and the dynamic flag (can’t live in a client file).

export const metadata = { title: 'Reset password | Liason' };
export const dynamic = 'force-dynamic';

export default function ResetLayout({ children }) {
  return children;
}
