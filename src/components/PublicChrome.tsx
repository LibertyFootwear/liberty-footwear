"use client";
import { usePathname } from "next/navigation";

/**
 * Renders the public site chrome (header, footer, newsletter popup) around the
 * page, but hides it on /admin routes — the admin panel has its own shell and
 * shouldn't show the customer-facing newsletter signup.
 */
export default function PublicChrome({
  banner,
  header,
  footer,
  popup,
  children,
}: {
  banner?: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  popup: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Admin has its own shell; the printable gift card is a standalone sheet (nothing else should print).
  const isAdmin = (pathname?.startsWith("/admin") || pathname?.startsWith("/gift-card/print")) ?? false;

  return (
    <>
      {!isAdmin && banner}
      {!isAdmin && header}
      <main className="flex-1">{children}</main>
      {!isAdmin && footer}
      {!isAdmin && popup}
    </>
  );
}
