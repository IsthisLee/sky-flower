/*
  Warnings:

  - Made the column `latitude` on table `Post` required. This step will fail if there are existing NULL values in that column.
  - Made the column `longitude` on table `Post` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "content" DROP NOT NULL,
ALTER COLUMN "latitude" SET NOT NULL,
ALTER COLUMN "longitude" SET NOT NULL,
ALTER COLUMN "view_count" SET DEFAULT 0;
