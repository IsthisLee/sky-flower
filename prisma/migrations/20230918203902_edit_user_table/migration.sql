/*
  Warnings:

  - You are about to drop the column `fileExtension` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `filePath` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `fileType` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `originalFileName` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - Added the required column `file_extension` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_path` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_type` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `original_file_name` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "fileExtension",
DROP COLUMN "filePath",
DROP COLUMN "fileType",
DROP COLUMN "originalFileName",
ADD COLUMN     "file_extension" TEXT NOT NULL,
ADD COLUMN     "file_path" TEXT NOT NULL,
ADD COLUMN     "file_type" "FileType" NOT NULL,
ADD COLUMN     "original_file_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email",
DROP COLUMN "name";
