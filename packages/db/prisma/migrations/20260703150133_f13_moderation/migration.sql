-- CreateEnum
CREATE TYPE "ContentState" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'TAKEN_DOWN');

-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('SUBMIT', 'APPROVE', 'REJECT', 'TAKEDOWN', 'FLAG');

-- CreateEnum
CREATE TYPE "ModeratorApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isModerator" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ContentPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "state" "ContentState" NOT NULL DEFAULT 'DRAFT',
    "safetyJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationEvent" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "ModerationAction" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeratorApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "motivation" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "availability" TEXT NOT NULL,
    "status" "ModeratorApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeratorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentPost_state_idx" ON "ContentPost"("state");

-- CreateIndex
CREATE INDEX "ContentPost_authorId_idx" ON "ContentPost"("authorId");

-- CreateIndex
CREATE INDEX "ModerationEvent_postId_idx" ON "ModerationEvent"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "ModeratorApplication_userId_key" ON "ModeratorApplication"("userId");

-- CreateIndex
CREATE INDEX "ModeratorApplication_status_idx" ON "ModeratorApplication"("status");

-- AddForeignKey
ALTER TABLE "ContentPost" ADD CONSTRAINT "ContentPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationEvent" ADD CONSTRAINT "ModerationEvent_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ContentPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationEvent" ADD CONSTRAINT "ModerationEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModeratorApplication" ADD CONSTRAINT "ModeratorApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

