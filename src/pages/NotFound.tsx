import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <p className="text-7xl font-extrabold text-[hsl(var(--border))] mb-4">404</p>
      <h1 className="text-xl font-bold text-[hsl(var(--text-primary))] mb-2">
        Page not found
      </h1>
      <p className="text-sm text-[hsl(var(--text-muted))] mb-8">
        This page doesn't exist or was removed.
      </p>
      <Link to="/" className="lb-btn-primary">
        Back to feed
      </Link>
    </div>
  );
}
