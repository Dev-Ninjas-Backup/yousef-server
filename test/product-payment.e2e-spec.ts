import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Product Payment System (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Mock authentication - replace with actual auth token
    authToken = 'Bearer mock-jwt-token';
  });

  describe('Product Creation with Plans', () => {
    it('should create free product (first 2)', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', authToken)
        .field('partName', 'Test Brake Pad')
        .field('category', 'Brakes')
        .field('condition', 'New')
        .field('price', '100')
        .field('quantity', '1')
        .field('plan', 'PAY_PER')
        .field('sellerEmail', 'test@example.com')
        .field('sellerType', 'INDIVIDUAL')
        .expect(201);
    });

    it('should require payment for pay-per plan after free limit', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', authToken)
        .field('partName', 'Test Brake Pad 3')
        .field('category', 'Brakes')
        .field('condition', 'New')
        .field('price', '100')
        .field('quantity', '1')
        .field('plan', 'PAY_PER')
        .field('sellerEmail', 'test@example.com')
        .field('sellerType', 'INDIVIDUAL')
        .expect(400)
        .expect((res) => {
          expect(res.body.code).toBe('PAY_PER_PAYMENT_REQUIRED');
          expect(res.body.amount).toBe(20);
        });
    });

    it('should require monthly subscription for monthly plan', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', authToken)
        .field('partName', 'Test Brake Pad Monthly')
        .field('category', 'Brakes')
        .field('condition', 'New')
        .field('price', '100')
        .field('quantity', '1')
        .field('plan', 'MONTHLY')
        .field('sellerEmail', 'test@example.com')
        .field('sellerType', 'INDIVIDUAL')
        .expect(400)
        .expect((res) => {
          expect(res.body.code).toBe('MONTHLY_SUBSCRIPTION_REQUIRED');
          expect(res.body.amount).toBe(100);
        });
    });
  });

  describe('Payment Status Endpoints', () => {
    it('should get payment status', () => {
      return request(app.getHttpServer())
        .get('/products/payment-status')
        .set('Authorization', authToken)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('canCreateFree');
          expect(res.body).toHaveProperty('hasActiveMonthlySubscription');
          expect(res.body).toHaveProperty('paymentOptions');
        });
    });

    it('should get user product limit', () => {
      return request(app.getHttpServer())
        .get('/products/user/limit')
        .set('Authorization', authToken)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('freeProductsUsed');
          expect(res.body).toHaveProperty('freeProductsRemaining');
          expect(res.body).toHaveProperty('canAddFreeProduct');
        });
    });
  });

  describe('Payment Creation Endpoints', () => {
    it('should create monthly payment session', () => {
      return request(app.getHttpServer())
        .post('/products/create-monthly-payment')
        .set('Authorization', authToken)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('url');
          expect(res.body.url).toContain('checkout.stripe.com');
        });
    });

    it('should create pay-per payment session', () => {
      return request(app.getHttpServer())
        .post('/products/create-payper-payment')
        .set('Authorization', authToken)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('url');
          expect(res.body.url).toContain('checkout.stripe.com');
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
