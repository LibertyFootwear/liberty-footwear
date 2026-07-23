"use client";
import { usePathname } from "next/navigation";

/**
 * Renders the public site chrome (header, footer, newsletter popup) around the
 * page, but hides it on /admin routes — the admin panel has its own shell and
 * shouldn't show the customer-facing newsletter signup.
 */
export default function PublicChrome({
  header,
  footer,
  popup,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  popup: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  return (
    <>
      {!isAdmin && header}
      <main className="flex-1">{children}</main>
      {!isAdmin && footer}
      {!isAdmin && popup}
    </>
  );
}
