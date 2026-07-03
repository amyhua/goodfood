/**
 * Moderation lifecycle end-to-end (F13, GOO-36). Gated behind RUN_DB_INTEGRATION; Neon.
 * Proves draft→pending(with safety result + SUBMIT event)→approved with a full audit trail,
 * only-approved is published, and the moderator application → owner promotion → isModerator flow.
 */
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@goodfood/db";
import {
  applyModerator,
  auditTrail,
  createDraft,
  decideModerator,
  listApproved,
  listModeratorApplications,
  moderate,
  submitForReview,
} from "./service";

const RUN = process.env.RUN_DB_INTEGRATION === "1";
const prisma = new PrismaClient();
const userIds: string[] = [];

afterAll(async () => {
  for (const id of userIds) await prisma.user.delete({ where: { id } }).catch(() => {});
  await prisma.$disconnect();
});

describe.skipIf(!RUN)("moderation", () => {
  const stamp = `${process.pid}-${Math.round(performance.now())}`;

  it("runs a content post draft → safety pre-check → approve with an audit trail", async () => {
    const author = await prisma.user.create({ data: { email: `mod-author-${stamp}@itest.local` } });
    const mod = await prisma.user.create({ data: { email: `mod-${stamp}@itest.local` } });
    userIds.push(author.id, mod.id);

    const draft = await createDraft(author.id, { title: "Great cook spotlight", body: "A wonderful whole-foods creator." });
    expect(draft.state).toBe("DRAFT");

    const { post, safety } = await submitForReview(author.id, draft.id);
    expect(post.state).toBe("PENDING_REVIEW");
    expect(safety.flagged).toBe(false);
    // Not published until approved.
    expect((await listApproved()).some((p) => p.id === draft.id)).toBe(false);

    await moderate(mod.id, draft.id, "APPROVE", "looks good");
    expect((await listApproved()).some((p) => p.id === draft.id)).toBe(true);

    const trail = await auditTrail(draft.id);
    expect(trail.map((e) => e.action)).toEqual(["SUBMIT", "APPROVE"]);
  });

  it("auto-flags unsafe content in the safety pre-check", async () => {
    const author = userIds[0]!;
    const draft = await createDraft(author, { title: "Detox miracle", body: "This cures diabetes, buy now!" });
    const { safety } = await submitForReview(author, draft.id);
    expect(safety.flagged).toBe(true);
    expect(safety.categories).toEqual(expect.arrayContaining(["medical-overclaim", "spam"]));
  });

  it("moderator application → owner promotion sets isModerator", async () => {
    const applicant = await prisma.user.create({ data: { email: `mod-app-${stamp}@itest.local` } });
    userIds.push(applicant.id);
    await applyModerator(applicant.id, {
      motivation: "I care about keeping the community safe and kind.",
      experience: "Moderated forums for 3 years",
      availability: "5 hours/week",
    });
    expect((await listModeratorApplications()).some((a) => a.userId === applicant.id)).toBe(true);
    await decideModerator(applicant.id, "APPROVED");
    const promoted = await prisma.user.findUnique({ where: { id: applicant.id } });
    expect(promoted?.isModerator).toBe(true);
  });
});
