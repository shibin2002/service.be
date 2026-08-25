-- DropForeignKey
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_uploaded_by_id_fkey";

-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_marked_by_id_fkey";

-- DropForeignKey
ALTER TABLE "service_jobs" DROP CONSTRAINT "service_jobs_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "stage_logs" DROP CONSTRAINT "stage_logs_user_id_fkey";

-- AlterTable
ALTER TABLE "attachments" ALTER COLUMN "uploaded_by_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "attendance" ALTER COLUMN "marked_by_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "service_jobs" ALTER COLUMN "created_by_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "stage_logs" ALTER COLUMN "user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "service_jobs" ADD CONSTRAINT "service_jobs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_logs" ADD CONSTRAINT "stage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_marked_by_id_fkey" FOREIGN KEY ("marked_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
