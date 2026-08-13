-- CreateTable
CREATE TABLE "payment_items" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_items_pkey" PRIMARY KEY ("id")
);

-- Migrate existing fixed columns into items (skip zero values)
INSERT INTO "payment_items" ("id", "payment_id", "name", "amount", "created_at")
SELECT gen_random_uuid(), "id", 'Inspection', "inspection_charge", CURRENT_TIMESTAMP FROM "payments" WHERE "inspection_charge" <> 0;

INSERT INTO "payment_items" ("id", "payment_id", "name", "amount", "created_at")
SELECT gen_random_uuid(), "id", 'Repair', "repair_charge", CURRENT_TIMESTAMP FROM "payments" WHERE "repair_charge" <> 0;

INSERT INTO "payment_items" ("id", "payment_id", "name", "amount", "created_at")
SELECT gen_random_uuid(), "id", 'Parts', "parts_cost", CURRENT_TIMESTAMP FROM "payments" WHERE "parts_cost" <> 0;

INSERT INTO "payment_items" ("id", "payment_id", "name", "amount", "created_at")
SELECT gen_random_uuid(), "id", 'Discount', "discount", CURRENT_TIMESTAMP FROM "payments" WHERE "discount" <> 0;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "paid" DECIMAL(12,2) NOT NULL DEFAULT 0;

UPDATE "payments" SET "paid" = "advance";

-- Drop old columns
ALTER TABLE "payments" DROP COLUMN "advance",
    DROP COLUMN "discount",
    DROP COLUMN "inspection_charge",
    DROP COLUMN "parts_cost",
    DROP COLUMN "repair_charge";

-- CreateIndex
CREATE INDEX "payment_items_payment_id_idx" ON "payment_items"("payment_id");

-- AddForeignKey
ALTER TABLE "payment_items" ADD CONSTRAINT "payment_items_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;