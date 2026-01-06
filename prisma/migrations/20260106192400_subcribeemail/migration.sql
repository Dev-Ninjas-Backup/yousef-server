-- CreateTable
CREATE TABLE "platformsubscribe" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT 'dibem65515@emaxasp.com',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platformsubscribe_pkey" PRIMARY KEY ("id")
);
