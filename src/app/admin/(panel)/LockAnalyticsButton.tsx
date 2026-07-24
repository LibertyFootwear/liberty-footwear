"use client";

import { useRouter } from "next/navigation";

export default function LockAnalyticsButton() {
  const router = useRouter();
  async function lock() {
    await fetch("/api/admin/analytics-unlock", { method: "DELETE" });
    router.push("/admin");
    router.refresh();
  }
  return (
    <button onClick={lock} className="text-xs text-white/60 hover:text-white transition block text-left">
      🔒 Lock analytics
    </button>
  );
}
