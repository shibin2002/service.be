-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('OPEN', 'COMPLETED', 'REJECTED');

-- AlterTable
ALTER TABLE "enquiries" ADD COLUMN     "status" "EnquiryStatus" NOT NULL DEFAULT 'OPEN';
