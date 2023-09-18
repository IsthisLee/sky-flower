-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('kakao');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "nickname" VARCHAR(255) NOT NULL,
    "profile_image" VARCHAR(255),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOauth" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "oauth_id" VARCHAR(255) NOT NULL,
    "provider" "Provider" NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "UserOauth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserOauth_oauth_id_provider_key" ON "UserOauth"("oauth_id", "provider");

-- AddForeignKey
ALTER TABLE "UserOauth" ADD CONSTRAINT "UserOauth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
