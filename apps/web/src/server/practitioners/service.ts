import "server-only";
import { prisma } from "@goodfood/db";
import { z } from "zod";
import { AuthError } from "@/server/auth/service";

/**
 * Practitioner applications + verification (F12). Roles are granted only by manual review
 * (admin). The verified badge derives from status === VERIFIED. Nothing here is medical advice.
 */
export const PRACTITIONER_ROLES = ["NUTRITIONIST", "DIETITIAN", "DOCTOR", "COACH"] as const;

export const applySchema = z.object({
  role: z.enum(PRACTITIONER_ROLES),
  roleTitle: z.string().trim().min(2).max(80),
  credentials: z.string().trim().min(3).max(1000),
  bio: z.string().trim().min(3).max(2000),
});

/** Submit or resubmit an application. Blocked while already VERIFIED. */
export async function applyPractitioner(userId: string, input: unknown) {
  const data = applySchema.parse(input);
  const existing = await prisma.practitionerProfile.findUnique({ where: { userId } });
  if (existing?.status === "VERIFIED") {
    throw new AuthError("You are already a verified practitioner", 409);
  }
  return prisma.practitionerProfile.upsert({
    where: { userId },
    update: { ...data, status: "PENDING", verifiedAt: null },
    create: { userId, ...data, status: "PENDING" },
  });
}

/** Admin decision. VERIFIED → sets the user's role + verifiedAt; REJECTED → resets to MEMBER. */
export async function decidePractitioner(userId: string, decision: "VERIFIED" | "REJECTED") {
  const profile = await prisma.practitionerProfile.findUnique({ where: { userId } });
  if (!profile) throw new AuthError("Application not found", 404);
  const [updated] = await prisma.$transaction([
    prisma.practitionerProfile.update({
      where: { userId },
      data: { status: decision, verifiedAt: decision === "VERIFIED" ? new Date() : null },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { role: decision === "VERIFIED" ? profile.role : "MEMBER" },
    }),
  ]);
  return updated;
}

export async function listPendingApplications() {
  return prisma.practitionerProfile.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { email: true, name: true } } },
  });
}

export interface VerifiedPractitioner {
  userId: string;
  name: string;
  roleTitle: string;
  bio: string;
  planCount: number;
}

/** Verified practitioners + how many live board posts they've published (adoptable content). */
export async function listVerifiedPractitioners(): Promise<VerifiedPractitioner[]> {
  const profiles = await prisma.practitionerProfile.findMany({
    where: { status: "VERIFIED" },
    orderBy: { verifiedAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });
  const result: VerifiedPractitioner[] = [];
  for (const p of profiles) {
    const planCount = await prisma.boardPost.count({ where: { authorId: p.userId, removedAt: null } });
    result.push({
      userId: p.userId,
      name: p.user.name ?? p.user.email.split("@")[0] ?? "practitioner",
      roleTitle: p.roleTitle,
      bio: p.bio,
      planCount,
    });
  }
  return result;
}
