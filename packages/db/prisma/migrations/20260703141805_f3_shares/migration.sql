-- CreateEnum
CREATE TYPE "ShareKind" AS ENUM ('PLAN', 'LIST');

-- CreateTable
CREATE TABLE "Share" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "ShareKind" NOT NULL,
    "userId" TEXT NOT NULL,
    "mealPlanId" TEXT,
    "savedShoppingListId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Share_slug_key" ON "Share"("slug");

-- CreateIndex
CREATE INDEX "Share_userId_idx" ON "Share"("userId");

-- CreateIndex
CREATE INDEX "Share_mealPlanId_idx" ON "Share"("mealPlanId");

-- CreateIndex
CREATE INDEX "Share_savedShoppingListId_idx" ON "Share"("savedShoppingListId");

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_savedShoppingListId_fkey" FOREIGN KEY ("savedShoppingListId") REFERENCES "SavedShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

