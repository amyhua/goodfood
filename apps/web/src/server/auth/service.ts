import "server-only";
import { prisma } from "@goodfood/db";
import { z } from "zod";
import { hashPassword, verifyPassword } from "./password";
import { createSession, destroySession, getSessionUser } from "./session";

/** Auth error carrying an HTTP status so route handlers can map it directly. */
export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().min(1).max(120).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
}

function toPublic(u: { id: string; email: string; name: string | null }): PublicUser {
  return { id: u.id, email: u.email, name: u.name };
}

export async function signUp(input: unknown): Promise<PublicUser> {
  const { email, name, password } = signupSchema.parse(input);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AuthError("An account with that email already exists", 409);
  const user = await prisma.user.create({
    data: { email, name: name ?? null, passwordHash: hashPassword(password) },
  });
  await createSession(user.id);
  return toPublic(user);
}

export async function login(input: unknown): Promise<PublicUser> {
  const { email, password } = loginSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { email } });
  // Verify even when the user is missing (constant-ish work) to avoid user enumeration.
  const ok = user?.passwordHash ? verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) throw new AuthError("Invalid email or password", 401);
  await createSession(user.id);
  return toPublic(user);
}

export async function logout(): Promise<void> {
  await destroySession();
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const user = await getSessionUser();
  return user ? toPublic(user) : null;
}

/** For protected route handlers: the signed-in user, or throw 401. */
export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Authentication required", 401);
  return user;
}
