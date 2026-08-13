-- AlterTable
ALTER TABLE "job_counters" ALTER COLUMN "id" SET DEFAULT 'default';

-- CreateTable
CREATE TABLE "enquiries" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "enquiry" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "enquiries_phone_idx" ON "enquiries"("phone");

-- CreateIndex
CREATE INDEX "enquiries_name_idx" ON "enquiries"("name");

-- CreateIndex
CREATE INDEX "enquiries_deleted_at_idx" ON "enquiries"("deleted_at");
