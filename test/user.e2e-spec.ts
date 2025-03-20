import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/typeorm/user.entity';
import { Repository } from 'typeorm';
import { E2EService } from '@app/e2e/e2e.service';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let e2eService: E2EService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
    }));
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    e2eService = moduleFixture.get(E2EService);
  });

  afterAll(async () => {
    await e2eService.clearDatabase(); // Clean up the test database
    await app.close();
  });

  beforeEach(async () => {
    await e2eService.clearDatabase(); // Clean up before each test
  });

  describe('POST /users', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'testuser',
          password: 'Password123'
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.username).toBe('testuser');
          expect(res.body).not.toHaveProperty('password');
          expect(res.body).toHaveProperty('createdAt');
        });
    });

    it('should convert username to lowercase', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'TestUser',
          password: 'Password123'
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
          username: 'testuser',
          password: 'Password123'
        })
        .expect(201);

      // Try to create another user with the same username
      return request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'testuser',
          password: 'DifferentPass123'
        })
        .expect(409);
    });

    it('should validate username format', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'te', // too short
          password: 'Password123'
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([
              'Username must be at least 3 characters long'
            ])
          );
        });
    });

    it('should validate password requirements', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'testuser',
          password: 'short' // too short and no numbers
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([
              'Password must contain at least one number',
              'Password must be at least 8 characters long'
            ])
          );
        });
    });

    it('should trim whitespace from username', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          username: '  testuser  ',
          password: 'Password123'
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
            expect.arrayContaining([
              'Username is required',
              'Password is required'
            ])
          );
        });
    });
  });
});