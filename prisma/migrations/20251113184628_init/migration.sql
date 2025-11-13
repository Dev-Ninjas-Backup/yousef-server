-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('contentStatus', 'LiveEvent', 'Shift', 'UserRolechange');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "public"."AdsPostion" AS ENUM ('FRONTPAGE', 'CATEGORYPAGE');

-- CreateEnum
CREATE TYPE "public"."LanguageType" AS ENUM ('Afrikaans', 'Albanian', 'Amharic', 'Arabic', 'Armenian', 'Assamese', 'Azerbaijani', 'Basque', 'Belarusian', 'Bengali', 'Bosnian', 'Bulgarian', 'Burmese', 'Catalan', 'Chinese', 'Croatian', 'Czech', 'Danish', 'Dutch', 'English', 'Estonian', 'Filipino', 'Finnish', 'French', 'Galician', 'Georgian', 'German', 'Greek', 'Gujarati', 'HaitianCreole', 'Hausa', 'Hebrew', 'Hindi', 'Hungarian', 'Icelandic', 'Igbo', 'Indonesian', 'Irish', 'Italian', 'Japanese', 'Javanese', 'Kannada', 'Kazakh', 'Khmer', 'Korean', 'Kurdish', 'Kyrgyz', 'Lao', 'Latvian', 'Lithuanian', 'Macedonian', 'Malagasy', 'Malay', 'Malayalam', 'Maltese', 'Maori', 'Marathi', 'Mongolian', 'Nepali', 'Norwegian', 'Odia', 'Pashto', 'Persian', 'Polish', 'Portuguese', 'Punjabi', 'Romanian', 'Russian', 'Samoan', 'ScotsGaelic', 'Serbian', 'Sesotho', 'Shona', 'Sindhi', 'Sinhala', 'Slovak', 'Slovenian', 'Somali', 'Spanish', 'Sundanese', 'Swahili', 'Swedish', 'Tajik', 'Tamil', 'Tatar', 'Telugu', 'Thai', 'Turkish', 'Turkmen', 'Ukrainian', 'Urdu', 'Uzbek', 'Vietnamese', 'Welsh', 'Xhosa', 'Yiddish', 'Yoruba', 'Zulu');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN', 'MEMBER', 'CONTIBUTOR');

-- CreateTable
CREATE TABLE "public"."NotificationToggle" (
    "id" TEXT NOT NULL,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "userUpdates" BOOLEAN NOT NULL DEFAULT false,
    "contentStatus" BOOLEAN NOT NULL DEFAULT false,
    "communication" BOOLEAN NOT NULL DEFAULT false,
    "surveyAndPoll" BOOLEAN NOT NULL DEFAULT false,
    "tasksAndProjects" BOOLEAN NOT NULL DEFAULT false,
    "scheduling" BOOLEAN NOT NULL DEFAULT false,
    "message" BOOLEAN NOT NULL DEFAULT false,
    "userRegistration" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "NotificationToggle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."file_instance" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_instance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "transactionId" TEXT,
    "amount" INTEGER,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "Price" INTEGER NOT NULL,
    "billingCycle" "public"."BillingCycle" NOT NULL,
    "shortBio" TEXT,
    "features" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PrivacyPolicy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtext" TEXT NOT NULL,

    CONSTRAINT "PrivacyPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TermsConditions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "TermsConditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FaqSection" (
    "id" TEXT NOT NULL,
    "sectionTitle" TEXT NOT NULL,

    CONSTRAINT "FaqSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Language" (
    "id" TEXT NOT NULL,
    "languageuse" INTEGER DEFAULT 0,
    "language" "public"."LanguageType" NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Ads" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT,
    "adsimage" TEXT NOT NULL,
    "subtitle" TEXT,
    "adsposition" "public"."AdsPostion",

    CONSTRAINT "Ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscribe" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscribe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "password" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "profilePhoto" TEXT,
    "bio" TEXT,
    "googleId" TEXT,
    "emailOtp" INTEGER,
    "otpExpiry" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "ReviewAlerts" BOOLEAN NOT NULL DEFAULT false,
    "resetOtp" INTEGER,
    "resetOtpExpiry" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isContibute" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subscriptionEndsAt" TIMESTAMP(3),
    "isMembership" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationToggle_userId_key" ON "public"."NotificationToggle"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserNotification_userId_notificationId_key" ON "public"."UserNotification"("userId", "notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_sessionId_key" ON "public"."payments"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_plans_name_key" ON "public"."payment_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PrivacyPolicy_title_key" ON "public"."PrivacyPolicy"("title");

-- CreateIndex
CREATE UNIQUE INDEX "TermsConditions_title_key" ON "public"."TermsConditions"("title");

-- CreateIndex
CREATE UNIQUE INDEX "subscribe_email_key" ON "public"."subscribe"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "public"."users"("googleId");

-- AddForeignKey
ALTER TABLE "public"."NotificationToggle" ADD CONSTRAINT "NotificationToggle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserNotification" ADD CONSTRAINT "UserNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "public"."Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."payment_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Faq" ADD CONSTRAINT "Faq_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."FaqSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
