-- AlterTable
ALTER TABLE "File" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PostLike" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserOauth" ALTER COLUMN "updated_at" DROP DEFAULT;
