import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-red text-xs font-bold uppercase tracking-widest mb-4">404</p>
      <h1 className="text-4xl sm:text-5xl font-black text-navy mb-4">Page Not Found</h1>
      <p className="text-gray-500 max-w-md mb-8">
        We couldn't find what you were looking for. The page may have been moved or doesn't exist.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link href="/shop" className="btn-primary">Browse Boots</Link>
        <Link href="/" className="btn-secondary">Go Home</Link>
      </div>
    </main>
  );
}
