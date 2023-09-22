/*
  Warnings:

  - The values [profile_image,post_image] on the enum `FileType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FileType_new" AS ENUM ('image', 'video', 'document');
ALTER TABLE "File" ALTER COLUMN "file_type" TYPE "FileType_new" USING ("file_type"::text::"FileType_new");
ALTER TYPE "FileType" RENAME TO "FileType_old";
ALTER TYPE "FileType_new" RENAME TO "FileType";
DROP TYPE "FileType_old";
COMMIT;
