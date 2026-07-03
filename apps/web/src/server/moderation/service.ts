import "server-only";
import { prisma, type Prisma } from "@goodfood/db";
import { z } from "zod";
import { AuthError } from "@/server/auth/service";
import { checkContentSafety } from "./safety";

/**
 * Content moderation lifecycle (F13): draft → pending review (with an automated safety result)
 * → approved / rejected (+ takedown). Every transition writes an immutable ModerationEvent, so
 * there is a full audit trail. Only APPROVED content is publishable.
 */
export const contentSchema = z.object({
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(5000),
});

export async function createDraft(authorId: string, input: unknown) {
  const data = contentSchema.parse(input);
  return prisma.contentPost.create({
    data: { authorId, title: data.title, body: data.body, state: "DRAFT" },
  });
}

/** Author submits a draft; runs the safety pre-check and records a SUBMIT event. */
export async function submitForReview(authorId: string, postId: string) {
  const post = await prisma.contentPost.findUnique({ where: { id: postId } });
  if (!post || post.authorId !== authorId) throw new AuthError("Content not found", 404);
  if (post.state !== "DRAFT" && post.state !== "REJECTED") {
    throw new AuthError("Content is not in a submittable state", 409);
  }
  const safety = await checkContentSafety(`${post.title}\n${post.body}`);
  const updated = await prisma.contentPost.update({
    where: { id: postId },
    data: { state: "PENDING_REVIEW", safetyJson: safety as unknown as Prisma.InputJsonValue },
  });
  await prisma.moderationEvent.create({
    data: {
      postId,
      actorId: authorId,
      action: "SUBMIT",
      note: safety.flagged ? `auto-flagged: ${safety.categories.join(", ")}` : "auto-check clean",
    },
  });
  return { post: updated, safety };
}

export type Decision = "APPROVE" | "REJECT" | "TAKEDOWN" | "FLAG";
const NEXT_STATE: Record<Exclude<Decision, "FLAG">, "APPROVED" | "REJECTED" | "TAKEN_DOWN"> = {
  APPROVE: "APPROVED",
  REJECT: "REJECTED",
  TAKEDOWN: "TAKEN_DOWN",
};

/** A moderator decides. FLAG only annotates; the others transition state. Always audited. */
export async function moderate(actorId: string, postId: string, decision: Decision, note?: string) {
  const post = await prisma.contentPost.findUnique({ where: { id: postId } });
  if (!post) throw new AuthError("Content not found", 404);
  const updated =
    decision === "FLAG"
      ? post
      : await prisma.contentPost.update({ where: { id: postId }, data: { state: NEXT_STATE[decision] } });
  await prisma.moderationEvent.create({
    data: { postId, actorId, action: decision, note: note ?? null },
  });
  return updated;
}

/** Moderator queue — content awaiting review. Deliberately NO author PII (scoped access). */
export function listQueue() {
  return prisma.contentPost.findMany({
    where: { state: "PENDING_REVIEW" },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, body: true, safetyJson: true, createdAt: true },
  });
}

/** Public: approved content that may be highlighted/published. */
export function listApproved() {
  return prisma.contentPost.findMany({
    where: { state: "APPROVED" },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, body: true },
  });
}

export function auditTrail(postId: string) {
  return prisma.moderationEvent.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    select: { action: true, note: true, createdAt: true, actorId: true },
  });
}

// ------------------------- moderator applications -------------------------

export const moderatorAppSchema = z.object({
  motivation: z.string().trim().min(10).max(1000),
  experience: z.string().trim().min(3).max(1000),
  availability: z.string().trim().min(3).max(500),
});

export async function applyModerator(userId: string, input: unknown) {
  const data = moderatorAppSchema.parse(input);
  return prisma.moderatorApplication.upsert({
    where: { userId },
    update: { ...data, status: "PENDING" },
    create: { userId, ...data, status: "PENDING" },
  });
}

/** Owner-only list of pending moderator applications. */
export function listModeratorApplications() {
  return prisma.moderatorApplication.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { email: true, name: true } } },
  });
}

/** Owner decides. APPROVED promotes the user to a community moderator. */
export async function decideModerator(userId: string, decision: "APPROVED" | "REJECTED") {
  const app = await prisma.moderatorApplication.findUnique({ where: { userId } });
  if (!app) throw new AuthError("Application not found", 404);
  const [updated] = await prisma.$transaction([
    prisma.moderatorApplication.update({ where: { userId }, data: { status: decision } }),
    prisma.user.update({ where: { id: userId }, data: { isModerator: decision === "APPROVED" } }),
  ]);
  return updated;
}
