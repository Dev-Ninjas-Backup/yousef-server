-- CreateTable
CREATE TABLE "adminsendmail" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adminsendmail_pkey" PRIMARY KEY ("id")
);
