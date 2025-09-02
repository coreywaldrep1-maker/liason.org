// app/reset/page.jsx
import ResetClient from './ResetClient';

export const dynamic = 'force-dynamic'; // optional, allowed here
export const metadata = { title: 'Reset password | Liason' };

export default function Page() {
  return <ResetClient />;
}
