-- CreateEnum
CREATE TYPE "ContactSubject" AS ENUM ('CAR_PARTS', 'CAR_SERVICE', 'OTHERS');

-- CreateEnum
CREATE TYPE "DayType" AS ENUM ('WEEKDAYS', 'WEEKENDS');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('contentStatus', 'LiveEvent', 'Shift', 'UserRolechange');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('GARAGE_SUBSCRIPTION', 'PAY_PER_PRODUCT', 'PRODUCT_PROMOTION_CREDIT', 'PRODUCT_PROMOTION', 'GENERAL');

-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('TRIAL', 'PAID');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "MessageDeliveryStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- CreateEnum
CREATE TYPE "SellerType" AS ENUM ('INDIVIDUAL', 'VERIFIED_SUPPLIER');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ListingPlan" AS ENUM ('PAY_PER_LISTING', 'MONTHLY_100');

-- CreateEnum
CREATE TYPE "PromotionAdStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AdsPostion" AS ENUM ('FRONTPAGE', 'CATEGORYPAGE');

-- CreateEnum
CREATE TYPE "LanguageType" AS ENUM ('Afrikaans', 'Albanian', 'Amharic', 'Arabic', 'Armenian', 'Assamese', 'Azerbaijani', 'Basque', 'Belarusian', 'Bengali', 'Bosnian', 'Bulgarian', 'Burmese', 'Catalan', 'Chinese', 'Croatian', 'Czech', 'Danish', 'Dutch', 'English', 'Estonian', 'Filipino', 'Finnish', 'French', 'Galician', 'Georgian', 'German', 'Greek', 'Gujarati', 'HaitianCreole', 'Hausa', 'Hebrew', 'Hindi', 'Hungarian', 'Icelandic', 'Igbo', 'Indonesian', 'Irish', 'Italian', 'Japanese', 'Javanese', 'Kannada', 'Kazakh', 'Khmer', 'Korean', 'Kurdish', 'Kyrgyz', 'Lao', 'Latvian', 'Lithuanian', 'Macedonian', 'Malagasy', 'Malay', 'Malayalam', 'Maltese', 'Maori', 'Marathi', 'Mongolian', 'Nepali', 'Norwegian', 'Odia', 'Pashto', 'Persian', 'Polish', 'Portuguese', 'Punjabi', 'Romanian', 'Russian', 'Samoan', 'ScotsGaelic', 'Serbian', 'Sesotho', 'Shona', 'Sindhi', 'Sinhala', 'Slovak', 'Slovenian', 'Somali', 'Spanish', 'Sundanese', 'Swahili', 'Swedish', 'Tajik', 'Tamil', 'Tatar', 'Telugu', 'Thai', 'Turkish', 'Turkmen', 'Ukrainian', 'Urdu', 'Uzbek', 'Vietnamese', 'Welsh', 'Xhosa', 'Yiddish', 'Yoruba', 'Zulu');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CAR_OWNER', 'GARAGE_OWNER', 'SUPER_ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('MECHANICAL_REPAIR', 'AC_HEATING', 'ELECTRICAL_SYSTEMS', 'BODY_AND_PAINT', 'DIAGNOSTICS', 'GENERAL_MAINTENANCE');

-- CreateEnum
CREATE TYPE "GarageStatus" AS ENUM ('APPROVE', 'PENDING', 'DECLINE', 'GARAGE_PAID_OWNER', 'GARAGE_TRAIL_OWNER');

-- CreateTable
CREATE TABLE "NotificationToggle" (
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
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" "ContactSubject" NOT NULL,
    "message" TEXT NOT NULL,
    "othersubject" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "isFromAdmin" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExclusiveOffer" (
    "id" TEXT NOT NULL,
    "bannerImage" TEXT NOT NULL,
    "validUnit" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "ExclusiveOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_instance" (
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
CREATE TABLE "Garage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coverPhoto" TEXT,
    "profileImage" TEXT,
    "garagePhone" TEXT,
    "email" TEXT,
    "street" TEXT,
    "city" TEXT,
    "emirate" TEXT,
    "address" TEXT,
    "garageLat" DOUBLE PRECISION,
    "garageLng" DOUBLE PRECISION,
    "description" TEXT,
    "certifications" TEXT[],
    "weekdaysHours" TEXT,
    "weekendsHours" TEXT,
    "brandExpertise" TEXT[],
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Garage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GarageService" (
    "garageId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "GarageService_pkey" PRIMARY KEY ("garageId","serviceId")
);

-- CreateTable
CREATE TABLE "GeneralSetting" (
    "id" TEXT NOT NULL,
    "platformName" TEXT,
    "supportEmail" TEXT,
    "PlatformDescription" TEXT,

    CONSTRAINT "GeneralSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSetting" (
    "id" TEXT NOT NULL,
    "platformCommission" INTEGER NOT NULL,
    "MinimumPayout" INTEGER NOT NULL,

    CONSTRAINT "PaymentSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentConfigure" (
    "id" TEXT NOT NULL,
    "sparePartsMonthly" TEXT,
    "perListingPrice" TEXT,
    "promotionalAdPrice" TEXT,
    "freePromotionalListings" TEXT,
    "freePromotionalListingStatus" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PaymentConfigure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "transactionId" TEXT,
    "amount" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "paymentType" "PaymentType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT,
    "garageSubscriptionId" TEXT,
    "productId" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "Price" INTEGER NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "shortBio" TEXT,
    "features" TEXT[],

    CONSTRAINT "PaymentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garage_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SubscriptionType" NOT NULL,
    "amount" INTEGER,
    "currency" TEXT,
    "stripeSessionId" TEXT,
    "stripePaymentId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "billingCycle" "BillingCycle",
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "garage_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateConversation" (
    "id" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "lastMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "files" TEXT[],
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivateMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateMessageStatus" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MessageDeliveryStatus" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateMessageStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sellers" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "sellerType" "SellerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationImage" TEXT,
    "subscriptionPlan" "ListingPlan" NOT NULL DEFAULT 'PAY_PER_LISTING',
    "subscriptionExpiresAt" TIMESTAMP(3),
    "freeProductsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ProductStatus" NOT NULL DEFAULT 'PENDING',
    "isPromoted" BOOLEAN NOT NULL DEFAULT false,
    "promoCost" DECIMAL(10,2),
    "views" INTEGER NOT NULL DEFAULT 0,
    "inquiries" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GaragePromotionQuota" (
    "id" TEXT NOT NULL,
    "garageId" TEXT NOT NULL,
    "freeListingsTotal" INTEGER NOT NULL DEFAULT 2,
    "freeListingsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GaragePromotionQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT,
    "adTitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "adType" TEXT NOT NULL,
    "discount" DOUBLE PRECISION,
    "location" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentId" TEXT,
    "status" "PromotionAdStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "garageId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyPolicy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtext" TEXT NOT NULL,

    CONSTRAINT "PrivacyPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermsConditions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "TermsConditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqSection" (
    "id" TEXT NOT NULL,
    "sectionTitle" TEXT NOT NULL,

    CONSTRAINT "FaqSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "languageuse" INTEGER DEFAULT 0,
    "language" "LanguageType" NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ads" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT,
    "adsimage" TEXT NOT NULL,
    "subtitle" TEXT,
    "adsposition" "AdsPostion",

    CONSTRAINT "Ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartsCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PartsCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscribe" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscribe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "password" TEXT,
    "bio" TEXT,
    "phone" TEXT,
    "userLat" DOUBLE PRECISION,
    "userLng" DOUBLE PRECISION,
    "tradeLicense" TEXT,
    "garageLogo" TEXT,
    "profilePhoto" TEXT,
    "city" TEXT,
    "emirate" TEXT,
    "garageName" TEXT,
    "garageStatus" "GarageStatus" NOT NULL DEFAULT 'PENDING',
    "googleId" TEXT,
    "emailOtp" INTEGER,
    "otpExpiry" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "ReviewAlerts" BOOLEAN NOT NULL DEFAULT false,
    "resetOtp" INTEGER,
    "resetOtpExpiry" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "isMembership" BOOLEAN NOT NULL DEFAULT false,
    "isEmailNotification" BOOLEAN NOT NULL DEFAULT false,
    "isCustomerInquiryAlerts" BOOLEAN NOT NULL DEFAULT false,
    "isSmsNotification" BOOLEAN NOT NULL DEFAULT false,
    "isEmailPromotional" BOOLEAN NOT NULL DEFAULT false,
    "isGarageVerified" BOOLEAN NOT NULL DEFAULT false,
    "trialStartDate" TIMESTAMP(3),
    "trialEndDate" TIMESTAMP(3),
    "isTrialActive" BOOLEAN NOT NULL DEFAULT false,
    "productApprovalAlerts" BOOLEAN NOT NULL DEFAULT false,
    "freeProductsListing" INTEGER NOT NULL DEFAULT 0,
    "freeProductsUsed" INTEGER NOT NULL DEFAULT 0,
    "promotionCredits" INTEGER NOT NULL DEFAULT 0,
    "garageTrailMember" BOOLEAN NOT NULL DEFAULT true,
    "garagePaidMember" BOOLEAN NOT NULL DEFAULT false,
    "hasPaid" BOOLEAN NOT NULL DEFAULT false,
    "nextBillingDate" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'CAR_OWNER',
    "serviceCategories" "ServiceCategory"[],
    "subscriptionEndsAt" TIMESTAMP(3),
    "subscriptionTrialStartDate" TIMESTAMP(3),
    "subscriptionTrialEndDate" TIMESTAMP(3),
    "isSubscriptionTrialActive" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionStartDate" TIMESTAMP(3),
    "subscriptionEndDate" TIMESTAMP(3),
    "nextSubscriptionBillingDate" TIMESTAMP(3),
    "isSubscribed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationToggle_userId_key" ON "NotificationToggle"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Garage_name_key" ON "Garage"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserNotification_userId_notificationId_key" ON "UserNotification"("userId", "notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_sessionId_key" ON "payments"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "garage_subscriptions_stripeSessionId_key" ON "garage_subscriptions"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateConversation_user1Id_user2Id_key" ON "PrivateConversation"("user1Id", "user2Id");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateMessageStatus_messageId_userId_key" ON "PrivateMessageStatus"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "sellers_email_key" ON "sellers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GaragePromotionQuota_garageId_key" ON "GaragePromotionQuota"("garageId");

-- CreateIndex
CREATE UNIQUE INDEX "PrivacyPolicy_title_key" ON "PrivacyPolicy"("title");

-- CreateIndex
CREATE UNIQUE INDEX "TermsConditions_title_key" ON "TermsConditions"("title");

-- CreateIndex
CREATE UNIQUE INDEX "PartsCategory_name_key" ON "PartsCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subscribe_email_key" ON "subscribe"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- AddForeignKey
ALTER TABLE "NotificationToggle" ADD CONSTRAINT "NotificationToggle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Garage" ADD CONSTRAINT "Garage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GarageService" ADD CONSTRAINT "GarageService_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Garage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GarageService" ADD CONSTRAINT "GarageService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PaymentPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_garageSubscriptionId_fkey" FOREIGN KEY ("garageSubscriptionId") REFERENCES "garage_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garage_subscriptions" ADD CONSTRAINT "garage_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateConversation" ADD CONSTRAINT "PrivateConversation_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateConversation" ADD CONSTRAINT "PrivateConversation_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateConversation" ADD CONSTRAINT "PrivateConversation_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "PrivateMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateMessage" ADD CONSTRAINT "PrivateMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "PrivateConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateMessage" ADD CONSTRAINT "PrivateMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateMessageStatus" ADD CONSTRAINT "PrivateMessageStatus_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "PrivateMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateMessageStatus" ADD CONSTRAINT "PrivateMessageStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GaragePromotionQuota" ADD CONSTRAINT "GaragePromotionQuota_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Garage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faq" ADD CONSTRAINT "Faq_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FaqSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
