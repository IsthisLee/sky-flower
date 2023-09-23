/*
  Warnings:

  - You are about to drop the column `type` on the `PostFile` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FileUsage" AS ENUM ('post_photo', 'map_marker');

-- AlterTable
ALTER TABLE "PostFile" DROP COLUMN "type",
ADD COLUMN     "usage" "FileUsage" NOT NULL DEFAULT 'post_photo';

-- DropEnum
DROP TYPE "FileUsageType";
