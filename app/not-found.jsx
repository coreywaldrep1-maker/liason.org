// app/not-found.jsx   <-- no "use client" here
import NotFoundClient from '../components/not-found-client'; // direct import, no barrel

export default function NotFound() {
  return <NotFoundClient />;
}
