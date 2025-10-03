// app/not-found.jsx
export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-gray-600">Sorry, we couldn’t find that page.</p>

      <a href="/" className="inline-block mt-6 underline">
        Go back home
      </a>
    </main>
  );
}
