import { requireAdmin } from "@/lib/adminAuth";
import { getSiteSettings } from "@/lib/siteSettings";
import SettingsForm from "./SettingsForm";
import { PageHeader } from "../ui";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  await requireAdmin();
  const settings = await getSiteSettings();
  return (
    <div className="p-8 max-w-2xl">
      <PageHeader title="Website Settings" subtitle="Control storefront behavior." />
      <SettingsForm initial={settings} />
    </div>
  );
}
