// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl py-16 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-gray-600">Sorry, we couldn’t find that page.</p>
      <div className="mt-6">
        <Link href="/" className="underline">Go home</Link>
      </div>
    </main>
  );
}
