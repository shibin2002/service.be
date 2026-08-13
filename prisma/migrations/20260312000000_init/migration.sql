-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'TECHNICIAN');
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID');
CREATE TYPE "AttachmentType" AS ENUM ('DEVICE_PHOTO', 'DAMAGE_PHOTO', 'INVOICE', 'DOCUMENT');
CREATE TYPE "NotificationType" AS ENUM ('NEW_JOB', 'STAGE_UPDATED', 'TECHNICIAN_ASSIGNED', 'PAYMENT_COMPLETED', 'GENERAL');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'TECHNICIAN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "refresh_token" TEXT,
    "reset_token" TEXT,
    "reset_expires" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "devices" (
    "id" UUID NOT NULL,
    "device_type" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "color" TEXT,
    "imei" TEXT,
    "serial_number" TEXT,
    "accessories_received" TEXT,
    "physical_condition" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_stages" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#6366F1',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_final" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_stages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_jobs" (
    "id" UUID NOT NULL,
    "job_number" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "reported_issue" TEXT NOT NULL,
    "diagnosis" TEXT,
    "technician_notes" TEXT,
    "assigned_technician_id" UUID,
    "created_by_id" UUID NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "warranty" BOOLEAN NOT NULL DEFAULT false,
    "current_stage_id" UUID NOT NULL,
    "estimated_delivery" TIMESTAMP(3),
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stage_logs" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "stage_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "inspection_charge" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "repair_charge" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "parts_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "advance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "recorded_by_id" UUID,
    "paid_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "uploaded_by_id" UUID NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "job_id" UUID,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "job_counters" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_counters_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "workflow_stages_name_key" ON "workflow_stages"("name");
CREATE UNIQUE INDEX "workflow_stages_slug_key" ON "workflow_stages"("slug");
CREATE UNIQUE INDEX "service_jobs_job_number_key" ON "service_jobs"("job_number");
CREATE UNIQUE INDEX "payments_job_id_key" ON "payments"("job_id");

-- Indexes
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");
CREATE INDEX "customers_phone_idx" ON "customers"("phone");
CREATE INDEX "customers_name_idx" ON "customers"("name");
CREATE INDEX "customers_email_idx" ON "customers"("email");
CREATE INDEX "customers_deleted_at_idx" ON "customers"("deleted_at");
CREATE INDEX "devices_imei_idx" ON "devices"("imei");
CREATE INDEX "devices_serial_number_idx" ON "devices"("serial_number");
CREATE INDEX "devices_device_type_idx" ON "devices"("device_type");
CREATE INDEX "devices_brand_model_idx" ON "devices"("brand", "model");
CREATE INDEX "devices_deleted_at_idx" ON "devices"("deleted_at");
CREATE INDEX "workflow_stages_sort_order_idx" ON "workflow_stages"("sort_order");
CREATE INDEX "workflow_stages_deleted_at_idx" ON "workflow_stages"("deleted_at");
CREATE INDEX "service_jobs_job_number_idx" ON "service_jobs"("job_number");
CREATE INDEX "service_jobs_customer_id_idx" ON "service_jobs"("customer_id");
CREATE INDEX "service_jobs_device_id_idx" ON "service_jobs"("device_id");
CREATE INDEX "service_jobs_assigned_technician_id_idx" ON "service_jobs"("assigned_technician_id");
CREATE INDEX "service_jobs_current_stage_id_idx" ON "service_jobs"("current_stage_id");
CREATE INDEX "service_jobs_priority_idx" ON "service_jobs"("priority");
CREATE INDEX "service_jobs_received_at_idx" ON "service_jobs"("received_at");
CREATE INDEX "service_jobs_deleted_at_idx" ON "service_jobs"("deleted_at");
CREATE INDEX "stage_logs_job_id_idx" ON "stage_logs"("job_id");
CREATE INDEX "stage_logs_stage_id_idx" ON "stage_logs"("stage_id");
CREATE INDEX "stage_logs_user_id_idx" ON "stage_logs"("user_id");
CREATE INDEX "stage_logs_created_at_idx" ON "stage_logs"("created_at");
CREATE INDEX "payments_status_idx" ON "payments"("status");
CREATE INDEX "payments_deleted_at_idx" ON "payments"("deleted_at");
CREATE INDEX "attachments_job_id_idx" ON "attachments"("job_id");
CREATE INDEX "attachments_type_idx" ON "attachments"("type");
CREATE INDEX "attachments_deleted_at_idx" ON "attachments"("deleted_at");
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");
CREATE INDEX "notifications_type_idx" ON "notifications"("type");
CREATE INDEX "notifications_deleted_at_idx" ON "notifications"("deleted_at");

-- Foreign keys
ALTER TABLE "service_jobs" ADD CONSTRAINT "service_jobs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_jobs" ADD CONSTRAINT "service_jobs_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_jobs" ADD CONSTRAINT "service_jobs_assigned_technician_id_fkey" FOREIGN KEY ("assigned_technician_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_jobs" ADD CONSTRAINT "service_jobs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_jobs" ADD CONSTRAINT "service_jobs_current_stage_id_fkey" FOREIGN KEY ("current_stage_id") REFERENCES "workflow_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stage_logs" ADD CONSTRAINT "stage_logs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "service_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stage_logs" ADD CONSTRAINT "stage_logs_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "workflow_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stage_logs" ADD CONSTRAINT "stage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "service_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "service_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "service_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
