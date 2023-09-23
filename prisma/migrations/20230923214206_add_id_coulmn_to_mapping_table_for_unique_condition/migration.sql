/*
  Warnings:

  - The primary key for the `PostFile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PostLike` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[post_id,file_id]` on the table `PostFile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,post_id]` on the table `PostLike` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PostFile" DROP CONSTRAINT "PostFile_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "PostFile_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PostLike" DROP CONSTRAINT "PostLike_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "PostLike_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "PostFile_post_id_file_id_key" ON "PostFile"("post_id", "file_id");

-- CreateIndex
CREATE UNIQUE INDEX "PostLike_user_id_post_id_key" ON "PostLike"("user_id", "post_id");
