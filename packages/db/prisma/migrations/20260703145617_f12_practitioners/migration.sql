-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'NUTRITIONIST', 'DIETITIAN', 'DOCTOR', 'COACH');

-- CreateEnum
CREATE TYPE "PractitionerStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'MEMBER';

-- CreateTable
CREATE TABLE "PractitionerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "credentials" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "status" "PractitionerStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PractitionerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PractitionerProfile_userId_key" ON "PractitionerProfile"("userId");

-- CreateIndex
CREATE INDEX "PractitionerProfile_status_idx" ON "PractitionerProfile"("status");

-- AddForeignKey
ALTER TABLE "PractitionerProfile" ADD CONSTRAINT "PractitionerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

