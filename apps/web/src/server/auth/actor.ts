import "server-only";
import { prisma } from "@goodfood/db";
import { getCurrentUser } from "./service";

const DEMO_USER_ID = "seed-demo-user";

/**
 * The acting owner for a request (F2). Signed-in → that user. Anonymous → the shared
 * demo user, so the app stays usable without an account but anonymous content is walled
 * off from every real account (and vice-versa) by row-level ownership. Clients never get
 * to name the owner — it's resolved server-side from the session.
 */
export interface Actor {
  userId: string;
  isAuthenticated: boolean;
}

export async function resolveActor(): Promise<Actor> {
  const user = await getCurrentUser();
  if (user) return { userId: user.id, isAuthenticated: true };
  const demo = await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: { id: DEMO_USER_ID, email: "demo@goodfood.local", name: "Demo", isDemo: true },
    select: { id: true },
  });
  return { userId: demo.id, isAuthenticated: false };
}
