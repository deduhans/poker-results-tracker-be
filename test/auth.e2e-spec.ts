import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/typeorm/user.entity';
import { Repository } from 'typeorm';
import { E2EService } from '@app/e2e/e2e.service';
import { TestHelper } from './helpers/test-helper';
import { userData } from './fixtures/test-data';

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;
    let e2eService: E2EService;
    let authCookie: string[];
    let testUser: User;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = await TestHelper.setupTestApp(moduleFixture);
        userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
        e2eService = moduleFixture.get(E2EService);
    });

    afterAll(async () => {
        await e2eService.clearDatabase();
        await app.close();
    });

    beforeEach(async () => {
        await e2eService.clearDatabase();

        // Create a test user
        const createUserResponse = await request(app.getHttpServer())
            .post('/users')
            .send({
                username: userData.username,
                password: userData.password
            });

        testUser = createUserResponse.body;
    });

    describe('POST /auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: userData.username,
                    password: userData.password
                });
            
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('userId');
            expect(response.body).toHaveProperty('username');
            expect(response.body.username).toBe(userData.username);
            
            // Check that session cookie is set
            const cookies = response.get('Set-Cookie');
            expect(cookies).toBeDefined();
            if (!cookies) {
                throw new Error('No cookies returned from login');
            }
            expect(cookies.length).toBeGreaterThan(0);
            
            // Save cookie for later tests
            authCookie = cookies;
        });

        it('should return 401 with invalid password', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: userData.username,
                    password: userData.invalidPassword
                });
            
            expect(response.status).toBe(401);
        });

        it('should return 404 with non-existent user', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: userData.nonExistentUsername,
                    password: userData.password
                });
            
            expect(response.status).toBe(404);
        });

        it('should return 404 with invalid input format', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: 'te', // Too short
                    password: userData.password
                });
            
            expect(response.status).toBe(404);
        });
    });

    describe('GET /auth/sessionStatus', () => {
        it('should return user data when authenticated', async () => {
            // Use the TestHelper to create a user and get auth cookie
            const { authCookie } = await TestHelper.createTestUser(app);
            
            // Then check session status
            const response = await request(app.getHttpServer())
                .get('/auth/sessionStatus')
                .set('Cookie', authCookie);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('userId');
            expect(response.body).toHaveProperty('username');
            expect(response.body.username).toBe(userData.username);
        });

        it('should return 403 when not authenticated', async () => {
            const response = await request(app.getHttpServer())
                .get('/auth/sessionStatus');
            
            expect(response.status).toBe(403);
        });
    });

    describe('GET /auth/logout', () => {
        it('should successfully logout and destroy session', async () => {
            // Use the TestHelper to create a user and get auth cookie
            const { authCookie } = await TestHelper.createTestUser(app);
            
            // Then logout
            const logoutResponse = await request(app.getHttpServer())
                .get('/auth/logout')
                .set('Cookie', authCookie);
            
            expect(logoutResponse.status).toBe(200);
            expect(logoutResponse.body).toEqual({});
            
            // Verify session is destroyed by trying to access protected endpoint
            const sessionResponse = await request(app.getHttpServer())
                .get('/auth/sessionStatus')
                .set('Cookie', authCookie);
            
            expect(sessionResponse.status).toBe(403);
        });

        it('should return 200 even if not logged in', async () => {
            const response = await request(app.getHttpServer())
                .get('/auth/logout');
            
            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
        });
    });

    describe('Authentication flow', () => {
        it('should maintain session across multiple requests', async () => {
            // Use the TestHelper to create a user and get auth cookie
            const { authCookie } = await TestHelper.createTestUser(app);
            
            // Check session status
            const sessionResponse1 = await request(app.getHttpServer())
                .get('/auth/sessionStatus')
                .set('Cookie', authCookie);
            
            expect(sessionResponse1.status).toBe(200);
            
            // Check session status again
            const sessionResponse2 = await request(app.getHttpServer())
                .get('/auth/sessionStatus')
                .set('Cookie', authCookie);
            
            expect(sessionResponse2.status).toBe(200);
            
            // Logout
            const logoutResponse = await request(app.getHttpServer())
                .get('/auth/logout')
                .set('Cookie', authCookie);
            
            expect(logoutResponse.status).toBe(200);
            
            // Verify session is destroyed
            const sessionResponse3 = await request(app.getHttpServer())
                .get('/auth/sessionStatus')
                .set('Cookie', authCookie);
            
            expect(sessionResponse3.status).toBe(403);
        });
    });
});
