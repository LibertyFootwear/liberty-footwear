import { requireAdmin } from "@/lib/adminAuth";
import { getSiteSettings } from "@/lib/siteSettings";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  await requireAdmin();
  const settings = await getSiteSettings();
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-black text-navy mb-1">Website Settings</h1>
      <p className="text-sm text-gray-400 mb-8">Control storefront behavior.</p>
      <SettingsForm initial={settings} />
    </div>
  );
}
