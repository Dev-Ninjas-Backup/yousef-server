import { UserRole } from '@prisma/client';
import { Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  fullName?: string;

  @Expose()
  phone?: string;

  // ---------- FILES ----------
  @Expose()
  tradeLicense?: string;

  @Expose()
  garageLogo?: string;

  @Expose()
  profilePhoto?: string;

  // ---------- LOCATION ----------
  @Expose()
  address?: string;

  @Expose()
  city?: string;

  @Expose()
  emirate?: string;

  // ---------- ROLE & CATEGORY ----------
  @Expose()
  role: UserRole;

  @Expose()
  serviceCategories?: string[];

  // ---------- ACCOUNT STATUS ----------
  @Expose()
  isVerified: boolean;

  @Expose()
  isActive: boolean;

  @Expose()
  isDeleted: boolean;

  @Expose()
  deletedAt?: Date;

  // ---------- GARAGE VERIFICATION ----------
  @Expose()
  isGarageVerified: boolean;

  // ---------- MEMBERSHIP / PAYMENT ----------
  @Expose()
  hasPaid: boolean;

  @Expose()
  subscriptionEndsAt?: Date;

  @Expose()
  nextBillingDate?: Date;

  @Expose()
  isMembership: boolean;

  // ---------- TRIAL ----------
  @Expose()
  trialStartDate?: Date;

  @Expose()
  trialEndDate?: Date;

  @Expose()
  isTrialActive: boolean;

  // ---------- PRODUCT LISTING ----------
  @Expose()
  freeProductsListing: number;

  // ---------- Alerts / Notifications ----------
  @Expose()
  isEmailNotification: boolean;

  @Expose()
  isCustomerInquiryAlerts: boolean;

  @Expose()
  isSmsNotification: boolean;

  @Expose()
  isEmailPromotional: boolean;

  @Expose()
  ReviewAlerts: boolean;

  @Expose()
  productApprovalAlerts: boolean;

  // ---------- TIMESTAMPS ----------
  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
