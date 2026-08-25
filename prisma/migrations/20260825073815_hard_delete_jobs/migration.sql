/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `service_jobs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "service_jobs_deleted_at_idx";

-- AlterTable
ALTER TABLE "service_jobs" DROP COLUMN "deleted_at";
