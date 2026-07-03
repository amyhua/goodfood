import "server-only";
import { prisma } from "@goodfood/db";
import { AuthError, getCurrentUser, type PublicUser } from "./service";

/** Moderator gate (F13): an admin (ADMIN_EMAILS) OR a user with isModerator. Scoped to
 *  moderation actions only — moderation endpoints never expose user PII. */
export async function requireModerator(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Sign in required", 401);
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (admins.includes(user.email.toLowerCase())) return user;
  const row = await prisma.user.findUnique({ where: { id: user.id }, select: { isModerator: true } });
  if (!row?.isModerator) throw new AuthError("Moderator access required", 403);
  return user;
}
