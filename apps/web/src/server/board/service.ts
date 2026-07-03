import "server-only";
import { prisma } from "@goodfood/db";
import { z } from "zod";
import { AuthError } from "@/server/auth/service";
import { duplicatePlan } from "@/server/plans/duplicate";
import { assertOwnsPlan } from "@/server/plans/ownership";
import { postToDiscord } from "@/lib/discord";
import { assertUnderLimit, BOARD_LIMITS, ONE_HOUR_MS } from "./rate-limit";

export const DIET_PRESETS = [
  "VEGAN",
  "VEGETARIAN",
  "PESCATARIAN",
  "NONDAIRY",
  "PALEO",
  "KETO",
  "WHOLE_FOODS",
] as const;
type Diet = (typeof DIET_PRESETS)[number];

export const publishSchema = z.object({
  mealPlanId: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  dietTags: z.array(z.enum(DIET_PRESETS)).max(7).default([]),
});

/** Publish a plan the caller owns to the shared board (explicit opt-in, rate-limited). */
export async function publishPost(userId: string, input: unknown) {
  const data = publishSchema.parse(input);
  await assertOwnsPlan(prisma, userId, data.mealPlanId);
  const recent = await prisma.boardPost.count({
    where: { authorId: userId, createdAt: { gte: new Date(Date.now() - ONE_HOUR_MS) } },
  });
  assertUnderLimit(recent, BOARD_LIMITS.postsPerHour, "posts");
  const post = await prisma.boardPost.create({
    data: {
      authorId: userId,
      mealPlanId: data.mealPlanId,
      title: data.title,
      description: data.description,
      dietTags: data.dietTags,
    },
    include: { author: { select: { name: true, email: true } } },
  });
  // Best-effort Discord cross-post (F9) — no-op unless DISCORD_WEBHOOK_URL is set; never blocks publish.
  await postToDiscord({
    title: post.title,
    author: post.author.name ?? post.author.email.split("@")[0] ?? "a member",
    dietTags: post.dietTags,
  }).catch(() => undefined);
  return post;
}

export interface FeedItem {
  id: string;
  title: string;
  description: string;
  dietTags: string[];
  author: string;
  planName: string;
  durationDays: number;
  likeCount: number;
  saveCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  createdAt: string;
}

/** The public feed: only live posts (removedAt null), newest first, optional diet filter. */
export async function listFeed(opts: { diet?: Diet; viewerId?: string }): Promise<FeedItem[]> {
  const viewer = opts.viewerId ?? "__anonymous__";
  const posts = await prisma.boardPost.findMany({
    where: { removedAt: null, ...(opts.diet ? { dietTags: { has: opts.diet } } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      author: { select: { name: true, email: true } },
      mealPlan: { select: { name: true, durationDays: true } },
      _count: { select: { likes: true, saves: true } },
      likes: { where: { userId: viewer }, select: { id: true } },
      saves: { where: { userId: viewer }, select: { id: true } },
    },
  });
  return posts.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    dietTags: p.dietTags,
    author: p.author.name ?? p.author.email.split("@")[0] ?? "member",
    planName: p.mealPlan.name,
    durationDays: p.mealPlan.durationDays,
    likeCount: p._count.likes,
    saveCount: p._count.saves,
    likedByMe: p.likes.length > 0,
    savedByMe: p.saves.length > 0,
    createdAt: p.createdAt.toISOString(),
  }));
}

async function livePostOrThrow(postId: string) {
  const post = await prisma.boardPost.findUnique({
    where: { id: postId },
    select: { id: true, mealPlanId: true, title: true, removedAt: true },
  });
  if (!post || post.removedAt) throw new AuthError("Post not found", 404);
  return post;
}

/** Duplicate a board post's plan into the caller's account. Returns the new plan id. */
export async function adoptPost(userId: string, postId: string): Promise<string> {
  const post = await livePostOrThrow(postId);
  return duplicatePlan(prisma, post.mealPlanId, userId, `${post.title} (from board)`);
}

export async function toggleLike(userId: string, postId: string) {
  await livePostOrThrow(postId);
  const existing = await prisma.boardLike.findUnique({ where: { userId_postId: { userId, postId } } });
  if (existing) await prisma.boardLike.delete({ where: { id: existing.id } });
  else await prisma.boardLike.create({ data: { userId, postId } });
  const likeCount = await prisma.boardLike.count({ where: { postId } });
  return { liked: !existing, likeCount };
}

export async function toggleSave(userId: string, postId: string) {
  await livePostOrThrow(postId);
  const existing = await prisma.boardSave.findUnique({ where: { userId_postId: { userId, postId } } });
  if (existing) await prisma.boardSave.delete({ where: { id: existing.id } });
  else await prisma.boardSave.create({ data: { userId, postId } });
  const saveCount = await prisma.boardSave.count({ where: { postId } });
  return { saved: !existing, saveCount };
}

const reportSchema = z.object({ reason: z.string().trim().min(1).max(500) });

export async function reportPost(userId: string, postId: string, input: unknown) {
  await livePostOrThrow(postId);
  const { reason } = reportSchema.parse(input);
  const recent = await prisma.boardReport.count({
    where: { userId, createdAt: { gte: new Date(Date.now() - ONE_HOUR_MS) } },
  });
  assertUnderLimit(recent, BOARD_LIMITS.reportsPerHour, "reports");
  await prisma.boardReport.create({ data: { userId, postId, reason } });
  return { ok: true };
}
