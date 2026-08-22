import UnsubscribeClient from "./UnsubscribeClient";

export const metadata = { title: "Unsubscribe | Liberty Footwear" };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-md mx-auto px-4 py-24">
        <UnsubscribeClient initialEmail={email ?? ""} />
      </div>
    </div>
  );
}
