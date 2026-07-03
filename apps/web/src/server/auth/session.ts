import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@goodfood/db";

/**
 * DB-backed sessions (F2). The session row id is the opaque bearer token; it lives in an
 * httpOnly, SameSite=Lax cookie. A session is valid iff the row exists and expiresAt is in
 * the future. No JWT — revocation is a row delete.
 */
export const SESSION_COOKIE = "gf_session";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createSession(userId: string): Promise<string> {
  const session = await prisma.session.create({
    data: { userId, expiresAt: new Date(Date.now() + TTL_MS) },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: session.expiresAt,
  });
  return session.id;
}

/** Resolve the current user from the session cookie; null when absent/expired. Expired
 *  rows are best-effort pruned. */
export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { id: token }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session.user;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.delete({ where: { id: token } }).catch(() => undefined);
  }
  jar.delete(SESSION_COOKIE);
}
