"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-red text-xs font-bold uppercase tracking-widest mb-4">Error</p>
      <h1 className="text-4xl sm:text-5xl font-black text-navy mb-4">Something Went Wrong</h1>
      <p className="text-gray-500 max-w-md mb-8">
        An unexpected error occurred. Please try again or contact us if the problem persists.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <button onClick={reset} className="btn-primary">Try Again</button>
        <Link href="/" className="btn-secondary">Go Home</Link>
      </div>
    </main>
  );
}
