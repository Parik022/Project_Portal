-- Roles: add HOD and ADMIN
ALTER TYPE "Role" ADD VALUE 'HOD';
ALTER TYPE "Role" ADD VALUE 'ADMIN';

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('ONSITE', 'REMOTE');

-- Attendance moves from "auto-marked weekly" to "daily check-in verified by a guide".
-- The old weekly rows were derived from submissions, so they are dropped, not migrated.
DROP TABLE "Attendance";
DROP TYPE "AttendanceStatus";
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- Submission review: REVIEWED becomes APPROVED; CHANGES_REQUESTED added
CREATE TYPE "SubmissionStatus_new" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUESTED');
ALTER TABLE "Submission" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Submission" ALTER COLUMN "status" TYPE "SubmissionStatus_new"
  USING (CASE WHEN "status"::text = 'REVIEWED' THEN 'APPROVED' ELSE "status"::text END)::"SubmissionStatus_new";
DROP TYPE "SubmissionStatus";
ALTER TYPE "SubmissionStatus_new" RENAME TO "SubmissionStatus";
ALTER TABLE "Submission" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable Submission
ALTER TABLE "Submission" ADD COLUMN "link" TEXT,
ADD COLUMN "feedback" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3);

-- AlterTable User
ALTER TABLE "User" ADD COLUMN "registerNo" TEXT,
ADD COLUMN "department" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "guideId" TEXT;

-- CreateTable
CREATE TABLE "Internship" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "mode" "WorkMode" NOT NULL DEFAULT 'REMOTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Internship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mode" "WorkMode" NOT NULL,
    "summary" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "remark" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_registerNo_key" ON "User"("registerNo");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_department_idx" ON "User"("department");
CREATE INDEX "User_guideId_idx" ON "User"("guideId");
CREATE UNIQUE INDEX "Internship_studentId_key" ON "Internship"("studentId");
CREATE INDEX "Project_facultyId_idx" ON "Project"("facultyId");
CREATE INDEX "Submission_projectId_status_idx" ON "Submission"("projectId", "status");
CREATE UNIQUE INDEX "Attendance_studentId_date_key" ON "Attendance"("studentId", "date");
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");
CREATE INDEX "Attendance_status_idx" ON "Attendance"("status");
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
