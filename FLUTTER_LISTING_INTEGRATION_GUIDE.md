# A-Z Flutter & Dart Integration Guide: Product Listing, Subscriptions & Promotions

This documentation provides an exhaustive, production-ready guide for **Flutter / Dart developers** to integrate the **Product Listing**, **Listing Plans (Pay-Per-Listing vs. Monthly Subscription)**, **Stripe Payments**, and **Product Promotion** features provided by the NestJS Backend.

---

## Table of Contents

1. [Architecture & Listing Strategy Overview](#1-architecture--listing-strategy-overview)
2. [Seller Types & Prerequisites](#2-seller-types--prerequisites)
3. [Listing Plans & Quota Rules](#3-listing-plans--quota-rules)
4. [Product Promotions & Featured Ads](#4-product-promotions--featured-ads)
5. [Swagger Endpoints Reference](#5-swagger-endpoints-reference)
   - [Check User Listing Quota](#1-check-user-listing-quota)
   - [Create Product (With Image Uploads)](#2-create-product-with-image-uploads)
   - [Create Pay-Per-Listing Payment Session](#3-create-pay-per-listing-payment-session)
   - [Create Monthly Subscription Payment Session](#4-create-monthly-subscription-payment-session)
   - [Create Promotion Payment Session](#5-create-promotion-payment-session)
   - [Fetch My Listings](#6-fetch-my-listings)
   - [Update Listing](#7-update-listing)
   - [Delete Listing](#8-delete-listing)
6. [Stripe Checkout Flow in Flutter](#6-stripe-checkout-flow-in-flutter)
7. [Complete Dart / Flutter Implementation Code](#7-complete-dart--flutter-implementation-code)

---

## 1. Architecture & Listing Strategy Overview

The Product Listing module allows individual sellers and verified suppliers/garages to list automotive spare parts on the marketplace.

```
+-----------------------------------------------------------------------------------+
|                                 Flutter App                                       |
+-----------------------------------------------------------------------------------+
       |                                      |                                  |
 1. Check Quota                         2. Create Product                  3. Payment Redirect
(GET /products/user/limit)          (POST /products - Multipart)         (If payment required)
       |                                      |                                  |
       v                                      v                                  v
+-----------------------------------------------------------------------------------+
|                                  NestJS Backend                                   |
+-----------------------------------------------------------------------------------+
       |                                      |                                  |
  Prisma DB                              AWS S3 Storage                       Stripe Gateway
 (Save Product & Check Quota)          (Upload Product Photos)               (Checkout Session)
```

---

## 2. Seller Types & Prerequisites

Before a product can be created, the user chooses their `sellerType`:

| Seller Type | Code Enum | Requirements |
| :--- | :--- | :--- |
| **Individual** | `INDIVIDUAL` | Basic user details (`sellerName`, `sellerEmail`, `sellerPhoneNumber`). No verification document required. |
| **Verified Supplier** | `VERIFIED_SUPPLIER` | Basic user details + **`verificationImage`** (Trade License / ID Document upload required). |

---

## 3. Listing Plans & Quota Rules

The backend evaluates product creation requests through the following logic:

### Plan Types (`plan` query/body param):
1. **`PAY_PER` (Pay-Per-Listing):** Pay per individual item listed (default: ~9 AED/USD per item).
2. **`MONTHLY` (Monthly Subscription):** Unlimited or bundled listings per month (e.g. Basic Plan = 10 products, Pro Plan = Unlimited).

### Logic Flow for Product Creation:
```
           +---------------------------------------------+
           | User initiates POST /products (Draft = false)|
           +---------------------------------------------+
                                  |
                    Is product saved as DRAFT?
                    /                        \
                  YES                        NO
                  /                            \
   [Bypass Quota & Allow]            Check User Quota:
                                     1. Has free quota slot available?
                                     2. Has pre-purchased Pay-Per credits?
                                     3. Has active Monthly Subscription?
                                     4. Has active Garage Subscription?
                                            |
                                     Can proceed free?
                                    /                 \
                                  YES                  NO
                                  /                      \
                    [Create Product &            Return 400 Error Response
                    Increment Quota]            with Specific Error Code:
                                                - PAY_PER_PAYMENT_REQUIRED
                                                - PRODUCT_MONTHLY_SUBSCRIPTION_REQUIRED
                                                - BASIC_PLAN_LIMIT_EXCEEDED
```

---

## 4. Product Promotions & Featured Ads

Users can promote their listings to appear in **Promoted / Featured** sections across the app.

- **Duration Options:** 
  - `7` Days
  - `15` Days
- **Payment Strategy:**
  - Can be paid directly via Stripe Checkout or using existing `user.promotionCredits`.
  - If `user.promotionCredits` is less than required promo price, backend responds with `PROMOTION_PAYMENT_REQUIRED` code and remaining balance needed.

---

## 5. Swagger Endpoints Reference

Base URL: `https://api.yourdomain.com` (or your backend URL)  
All protected endpoints require HTTP Header:  
`Authorization: Bearer <JWT_ACCESS_TOKEN>`

---

### 1. Check User Listing Quota

Returns the user's free listings limit, remaining slots, active subscriptions, and pay-per credits.

- **Endpoint:** `GET /products/user/limit`
- **Query Parameters:** `garageId` (Optional string)
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "userType": "INDIVIDUAL",
    "freeListingsTotal": 2,
    "freeListingsUsed": 1,
    "freeListingsRemaining": 1,
    "hasActiveMonthly": false,
    "hasPayPerCredit": false,
    "productMonthlyPlanType": null,
    "canCreateFreeProduct": true
  }
}
```

---

### 2. Create Product (With Image Uploads)

Creates a new product listing. Requires `multipart/form-data`.

- **Endpoint:** `POST /products`
- **Content-Type:** `multipart/form-data`
- **Form Fields:**

| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `partName` | String | **Yes** | Title/Name of the auto part |
| `categoryId` | String | **Yes** | Valid Category UUID |
| `price` | Number/String | **Yes** | Price in local currency |
| `condition` | String | **Yes** | `NEW`, `USED`, or `REFURBISHED` |
| `sellerEmail` | String | **Yes** | Seller contact email |
| `sellerType` | String | **Yes** | `INDIVIDUAL` or `VERIFIED_SUPPLIER` |
| `plan` | String | **Yes** | `PAY_PER` or `MONTHLY` |
| `brand` | String | No | Manufacturer brand name |
| `quantity` | Number | No | Default `1` |
| `description` | String | No | Part description |
| `sellerName` | String | No | Seller full name |
| `sellerPhoneNumber` | String | No | Seller contact phone |
| `garageId` | String | No | Associated Garage ID |
| `status` | String | No | `PENDING` (publish) or `DRAFT` |
| `isPromoted` | Boolean | No | `true` or `false` |
| `promotedDuration` | String | No | `'7'` or `'15'` (required if `isPromoted=true`) |
| **`photos`** | File(s) | No | Multiple images (`photos` key repeated) |
| **`verificationImage`** | File | Cond. | Required if `sellerType === 'VERIFIED_SUPPLIER'` |

#### Error Responses (Payment Required):
If user limit is exceeded and no subscription exists, API returns HTTP `400 Bad Request`:

```json
// PAY_PER Required:
{
  "statusCode": 400,
  "message": {
    "message": "9$ Pay-Per payment required to create this product",
    "code": "PAY_PER_PAYMENT_REQUIRED",
    "amount": 9,
    "plan": "PAY_PER"
  }
}
```

```json
// PROMOTION Credit Required:
{
  "statusCode": 400,
  "message": {
    "message": "99 AED payment or credits required for product promotion.",
    "code": "PROMOTION_PAYMENT_REQUIRED",
    "amount": 99
  }
}
```

---

### 3. Create Pay-Per-Listing Payment Session

Generates a Stripe Checkout URL for purchasing a single product listing credit.

- **Endpoint:** `POST /products/create-payper-payment`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_a1b2c3...",
    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3..."
  }
}
```

---

### 4. Create Monthly Subscription Payment Session

Generates a Stripe Checkout URL for subscribing to a Monthly Listing Plan.

- **Endpoint:** `POST /products/create-monthly-payment`
- **Body (`application/json`):**
```json
{
  "planType": "PRO" // "BASIC" or "PRO"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_x9y8z7...",
    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_x9y8z7..."
  }
}
```

---

### 5. Create Promotion Payment Session

Generates a Stripe Checkout session to purchase promotion credits for featured ads.

- **Endpoint:** `POST /products/create-promotion-payment`
- **Body (`application/json`):**
```json
{
  "duration": "7", // "7" or "15"
  "useCredits": true
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_promo123...",
    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_promo123..."
  }
}
```

---

### 6. Fetch My Listings

- **Endpoint:** `GET /products/my-products`
- **Query Parameters:** `page` (default 1), `limit` (default 10), `search`, `status` (`APPROVED`, `PENDING`, `DRAFT`)

---

### 7. Update Listing

- **Endpoint:** `PATCH /products/:id`
- **Content-Type:** `multipart/form-data`

---

### 8. Delete Listing

- **Soft Delete (Move to Drafts):** `DELETE /products/:id`
- **Permanent Delete:** `DELETE /products/:id/permanent`

---

## 6. Stripe Checkout Flow in Flutter

1. **Submit Product Form** via `POST /products`.
2. **If response is 201 Created:** Product listed successfully! Show success dialog.
3. **If response returns 400** with code:
   - `PAY_PER_PAYMENT_REQUIRED` -> Call `POST /products/create-payper-payment` -> Open `checkoutUrl` in `webview_flutter` or `url_launcher`.
   - `PRODUCT_MONTHLY_SUBSCRIPTION_REQUIRED` -> Call `POST /products/create-monthly-payment` -> Open `checkoutUrl`.
   - `PROMOTION_PAYMENT_REQUIRED` -> Call `POST /products/create-promotion-payment` -> Open `checkoutUrl`.
4. After user completes payment in webview, redirect back to app using success deep-link / webview URL listener (`/payment/success`), then retry product creation.

---

## 7. Complete Dart / Flutter Implementation Code

Here is a modular, production-ready Dart client using **`dio`** for API calls.

### 1. Data Models (`lib/models/product_models.dart`)

```dart
enum SellerType { INDIVIDUAL, VERIFIED_SUPPLIER }
enum ListingPlan { PAY_PER, MONTHLY }
enum ProductCondition { NEW, USED, REFURBISHED }

class ProductLimitQuota {
  final String userType;
  final int freeListingsTotal;
  final int freeListingsUsed;
  final int freeListingsRemaining;
  final bool hasActiveMonthly;
  final bool hasPayPerCredit;
  final bool canCreateFreeProduct;

  ProductLimitQuota({
    required this.userType,
    required this.freeListingsTotal,
    required this.freeListingsUsed,
    required this.freeListingsRemaining,
    required this.hasActiveMonthly,
    required this.hasPayPerCredit,
    required this.canCreateFreeProduct,
  });

  factory ProductLimitQuota.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? json;
    return ProductLimitQuota(
      userType: data['userType'] ?? 'INDIVIDUAL',
      freeListingsTotal: data['freeListingsTotal'] ?? 0,
      freeListingsUsed: data['freeListingsUsed'] ?? 0,
      freeListingsRemaining: data['freeListingsRemaining'] ?? 0,
      hasActiveMonthly: data['hasActiveMonthly'] ?? false,
      hasPayPerCredit: data['hasPayPerCredit'] ?? false,
      canCreateFreeProduct: data['canCreateFreeProduct'] ?? false,
    );
  }
}

class CreateProductRequest {
  final String partName;
  final String categoryId;
  final String condition;
  final double price;
  final int quantity;
  final String? brand;
  final String? description;
  final SellerType sellerType;
  final String sellerEmail;
  final String? sellerName;
  final String? sellerPhoneNumber;
  final ListingPlan plan;
  final String? garageId;
  final bool isPromoted;
  final String? promotedDuration; // "7" or "15"
  final List<String> photoPaths;
  final String? verificationImagePath;

  CreateProductRequest({
    required this.partName,
    required this.categoryId,
    required this.condition,
    required this.price,
    this.quantity = 1,
    this.brand,
    this.description,
    required this.sellerType,
    required this.sellerEmail,
    this.sellerName,
    this.sellerPhoneNumber,
    required this.plan,
    this.garageId,
    this.isPromoted = false,
    this.promotedDuration,
    this.photoPaths = const [],
    this.verificationImagePath,
  });
}
```

### 2. API Service (`lib/services/product_api_service.dart`)

```dart
import 'package:dio/dio.dart';
import '../models/product_models.dart';

class ProductApiService {
  final Dio _dio;
  final String token;

  ProductApiService({required String baseUrl, required this.token})
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          headers: {
            'Authorization': 'Bearer $token',
          },
        ));

  /// Check User Product Listing Limit Quota
  Future<ProductLimitQuota> checkUserQuota({String? garageId}) async {
    try {
      final response = await _dio.get('/products/user/limit', queryParameters: {
        if (garageId != null) 'garageId': garageId,
      });
      return ProductLimitQuota.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }

  /// Create Product with Multipart Files
  Future<Map<String, dynamic>> createProduct(CreateProductRequest req) async {
    final formData = FormData();

    // Text Fields
    formData.fields.addAll([
      MapEntry('partName', req.partName),
      MapEntry('categoryId', req.categoryId),
      MapEntry('condition', req.condition),
      MapEntry('price', req.price.toString()),
      MapEntry('quantity', req.quantity.toString()),
      MapEntry('sellerType', req.sellerType.name),
      MapEntry('sellerEmail', req.sellerEmail),
      MapEntry('plan', req.plan.name),
      if (req.brand != null) MapEntry('brand', req.brand!),
      if (req.description != null) MapEntry('description', req.description!),
      if (req.sellerName != null) MapEntry('sellerName', req.sellerName!),
      if (req.sellerPhoneNumber != null) MapEntry('sellerPhoneNumber', req.sellerPhoneNumber!),
      if (req.garageId != null) MapEntry('garageId', req.garageId!),
      MapEntry('isPromoted', req.isPromoted.toString()),
      if (req.promotedDuration != null) MapEntry('promotedDuration', req.promotedDuration!),
    ]);

    // Attach Product Photos
    for (String path in req.photoPaths) {
      formData.files.add(MapEntry(
        'photos',
        await MultipartFile.fromFile(path),
      ));
    }

    // Attach Verification Image (Required for VERIFIED_SUPPLIER)
    if (req.verificationImagePath != null) {
      formData.files.add(MapEntry(
        'verificationImage',
        await MultipartFile.fromFile(req.verificationImagePath!),
      ));
    }

    try {
      final response = await _dio.post('/products', data: formData);
      return response.data;
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        // Return custom error body containing code like PAY_PER_PAYMENT_REQUIRED
        throw e.response?.data;
      }
      rethrow;
    }
  }

  /// Generate Pay-Per Checkout Session
  Future<String> createPayPerPaymentSession() async {
    final res = await _dio.post('/products/create-payper-payment');
    return res.data['data']['checkoutUrl'];
  }

  /// Generate Monthly Subscription Session
  Future<String> createMonthlySubscriptionSession({String planType = 'PRO'}) async {
    final res = await _dio.post('/products/create-monthly-payment', data: {
      'planType': planType,
    });
    return res.data['data']['checkoutUrl'];
  }

  /// Generate Promotion Payment Session
  Future<String> createPromotionPaymentSession({String duration = '7', bool useCredits = true}) async {
    final res = await _dio.post('/products/create-promotion-payment', data: {
      'duration': duration,
      'useCredits': useCredits,
    });
    return res.data['data']['checkoutUrl'];
  }
}
```

### 3. Usage Example in Flutter UI (`lib/views/create_product_flow.dart`)

```dart
void handleCreateProduct(ProductApiService apiService, CreateProductRequest request) async {
  try {
    // 1. Attempt product creation
    final result = await apiService.createProduct(request);
    print("Product created successfully: $result");
    // Show success banner & navigate back
  } catch (error) {
    // 2. Handle Payment Required Exception
    if (error is Map && error.containsKey('message')) {
      final messageObj = error['message'];
      final String? errorCode = messageObj is Map ? messageObj['code'] : null;

      if (errorCode == 'PAY_PER_PAYMENT_REQUIRED') {
        print("Pay per listing payment needed. Redirecting to Stripe...");
        final String checkoutUrl = await apiService.createPayPerPaymentSession();
        openStripeWebView(checkoutUrl);
      } else if (errorCode == 'PRODUCT_MONTHLY_SUBSCRIPTION_REQUIRED') {
        print("Monthly subscription needed. Redirecting to Stripe...");
        final String checkoutUrl = await apiService.createMonthlySubscriptionSession(planType: 'PRO');
        openStripeWebView(checkoutUrl);
      } else if (errorCode == 'PROMOTION_PAYMENT_REQUIRED') {
        print("Promotion payment needed. Redirecting to Stripe...");
        final String checkoutUrl = await apiService.createPromotionPaymentSession(
          duration: request.promotedDuration ?? '7',
        );
        openStripeWebView(checkoutUrl);
      } else {
        print("Error creating product: ${error['message']}");
      }
    } else {
      print("Unexpected error: $error");
    }
  }
}

void openStripeWebView(String url) {
  // Use webview_flutter or url_launcher to open Stripe checkout URL
}
```

---

## Summary Checklist for Flutter Developers

- [x] Check user listing quota with `GET /products/user/limit`.
- [x] Send product metadata & files via `POST /products` using `multipart/form-data`.
- [x] If `sellerType == VERIFIED_SUPPLIER`, attach `verificationImage` file.
- [x] Intercept `400` errors and check `code` (`PAY_PER_PAYMENT_REQUIRED`, `PRODUCT_MONTHLY_SUBSCRIPTION_REQUIRED`, `PROMOTION_PAYMENT_REQUIRED`).
- [x] Call the matching Payment endpoint to obtain a Stripe `checkoutUrl`.
- [x] Launch the `checkoutUrl` in a Webview or In-App Browser to complete payment.
