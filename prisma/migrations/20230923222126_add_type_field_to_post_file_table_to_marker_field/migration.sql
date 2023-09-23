-- CreateEnum
CREATE TYPE "FileUsageType" AS ENUM ('post_photo', 'map_marker');

-- AlterTable
ALTER TABLE "PostFile" ADD COLUMN     "type" "FileUsageType" NOT NULL DEFAULT 'post_photo';
