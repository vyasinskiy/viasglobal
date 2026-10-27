-- AlterTable
ALTER TABLE "invoices" RENAME COLUMN "uploaded_to_s3" TO "uploaded_to_storage";

-- AlterTable
ALTER TABLE "event_attachments" RENAME COLUMN "s3_key" TO "storage_key";
