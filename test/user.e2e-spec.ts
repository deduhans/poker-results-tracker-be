import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestHelper } from './helpers/test-helper';
import { userData } from './fixtures/test-data';
import { E2EService } from '@app/e2e/e2e.service';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let e2eService: E2EService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await TestHelper.setupTestApp(moduleFixture);
    e2eService = moduleFixture.get(E2EService);
  });

  afterAll(async () => {
    await e2eService.clearDatabase();
    await app.close();
  });

  beforeEach(async () => {
    // Clear the database before each test using the E2EService
    await e2eService.clearDatabase();
  });

  describe('POST /users', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          username: userData.username,
          password: userData.password,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.username).toBe(userData.username);
          expect(res.body).not.toHaveProperty('password');
          expect(res.body).toHaveProperty('createdAt');
        });
    });

    it('should convert username to lowercase', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'TestUser',
          password: userData.password,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.username).toBe('testuser');
        });
    });

    it('should not create user with existing username', async () => {
      // First create a user
      await request(app.getHttpServer())
        .post('/users')
        .send({
          username: userData.username,
          password: userData.password,
        })
        .expect(201);

      // Try to create another user with the same username
      return request(app.getHttpServer())
        .post('/users')
        .send({
          username: userData.username,
          password: userData.password,
        })
        .expect(409);
    });

    it('should validate username format', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'te', // too short
          password: userData.password,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining(['Username must be at least 3 characters long']),
          );
        });
    });

    it('should validate password requirements', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          username: userData.username,
          password: 'short', // too short and no numbers
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([
              'Password must contain at least one number',
              'Password must be at least 8 characters long',
            ]),
          );
        });
    });

    it('should trim whitespace from username', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          username: '  testuser  ',
          password: userData.password,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.username).toBe('testuser');
        });
    });

    it('should require all required fields', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining(['Username is required', 'Password is required']),
          );
        });
    });
  });
});
