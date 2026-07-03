import "server-only";
import { AuthError, getCurrentUser, type PublicUser } from "./service";

/** Admin gate (F10). An admin is a signed-in user whose email is in the ADMIN_EMAILS allowlist
 *  (comma-separated). With ADMIN_EMAILS unset, there are no admins — the admin surface is closed. */
export async function requireAdmin(): Promise<PublicUser> {
  const user = await getCurrentUser();
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!user || !admins.includes(user.email.toLowerCase())) {
    throw new AuthError("Admin access required", 403);
  }
  return user;
}
