import { getAuthUserId } from "./authJwt";
import { getUserById } from "./userDb";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/account/login?next=/admin");
  const user = await getUserById(userId);
  if (!user || !(user as unknown as Record<string, unknown>).is_admin) redirect("/");
  return user;
}
