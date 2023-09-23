/*
  Warnings:

  - Changed the type of `usage` on the `PostFile` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PostFileUsage" AS ENUM ('post_photo', 'map_marker');

-- AlterTable
ALTER TABLE "PostFile" DROP COLUMN "usage",
ADD COLUMN     "usage" "PostFileUsage" NOT NULL;

-- DropEnum
DROP TYPE "FileUsage";
