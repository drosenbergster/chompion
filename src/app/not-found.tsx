import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">🍽️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500 mb-6">
          We couldn&apos;t find what you were looking for. It may have been moved or deleted.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
