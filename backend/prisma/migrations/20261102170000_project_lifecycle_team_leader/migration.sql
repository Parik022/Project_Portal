-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "domain" TEXT NOT NULL DEFAULT 'General',
ADD COLUMN "status" "ProjectStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN "startDate" DATE,
ADD COLUMN "deadline" DATE,
ADD COLUMN "reviewRemark" TEXT,
ADD COLUMN "proposedById" TEXT;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN "leaderId" TEXT;

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Team" ADD CONSTRAINT "Team_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
