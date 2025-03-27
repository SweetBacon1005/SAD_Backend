import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUser: { email: string; password: string };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    testUser = { email: 'testuser@example.com', password: 'Test1234' };
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await app.close();
  });

  let token: string;

  it('POST /auth/sign-up - Đăng ký tài khoản', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send({
        email: testUser.email,
        password: testUser.password,
        name: 'Test User',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
    token = response.body.token;
  });

  it('POST /auth/sign-in - Đăng nhập', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    token = response.body.token;
  });

  it('POST /auth/forgot-password - Quên mật khẩu', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: testUser.email });

    expect(response.status).toBe(200);
  });

  it('GET /auth/profile - Lấy thông tin user (Bảo vệ bằng JWT)', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(testUser.email);
  });
});
