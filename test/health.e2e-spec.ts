import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@app/app.module';
import { E2EService } from '@app/e2e/e2e.service';
import { TestHelper } from './helpers/test-helper';

describe('HealthController (e2e)', () => {
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
    await e2eService.clearDatabase(); // Clean up the test database
    await app.close();
  });

  beforeEach(async () => {
    await e2eService.clearDatabase(); // Clean up before each test
  });

  describe('GET /health', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(new Date(res.body.timestamp)).toBeInstanceOf(Date);
        });
    });
  });
});
