// app/not-found.jsx
export default function NotFound() {
  return (
    <main style={{ maxWidth: 720, margin: '4rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontSize: 28, fontWeight: 600 }}>Page not found</h1>
      <p style={{ marginTop: 12 }}>
        Sorry, we couldn’t find that page.
      </p>
      <a href="/" style={{ marginTop: 24, display: 'inline-block', textDecoration: 'underline' }}>
        Go home
      </a>
    </main>
  );
}
