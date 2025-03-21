import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/typeorm/user.entity';
import { Repository } from 'typeorm';
import { E2EService } from '@app/e2e/e2e.service';
import * as session from 'express-session';
import * as passport from 'passport';

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

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            transform: true,
        }));

        // Set up session middleware
        app.use(
            session({
                secret: 'test-secret',
                resave: false,
                saveUninitialized: false,
            })
        );
        app.use(passport.initialize());
        app.use(passport.session());

        await app.init();

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
                username: 'testuser',
                password: 'Password123'
            });

        testUser = createUserResponse.body;
    });

    describe('POST /auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'Password123'
                });
            
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('userId');
            expect(response.body).toHaveProperty('username');
            expect(response.body.username).toBe('testuser');
            
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
                    username: 'testuser',
                    password: 'WrongPassword'
                });
            
            expect(response.status).toBe(401);
        });

        it('should return 404 with non-existent user', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: 'nonexistentuser',
                    password: 'Password123'
                });
            
            expect(response.status).toBe(404);
        });

        it('should return 404 with invalid input format', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: 'te', // Too short
                    password: 'Password123'
                });
            
            expect(response.status).toBe(404);
        });
    });

    describe('GET /auth/sessionStatus', () => {
        it('should return user data when authenticated', async () => {
            // First login to get session cookie
            const loginResponse = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'Password123'
                });
            
            const cookies = loginResponse.get('Set-Cookie');
            if (!cookies) {
                throw new Error('No cookies returned from login');
            }
            
            // Then check session status
            const response = await request(app.getHttpServer())
                .get('/auth/sessionStatus')
                .set('Cookie', cookies);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('userId');
            expect(response.body).toHaveProperty('username');
            expect(response.body.username).toBe('testuser');
        });

        it('should return 403 when not authenticated', async () => {
            const response = await request(app.getHttpServer())
                .get('/auth/sessionStatus');
            
            expect(response.status).toBe(403);
        });
    });

    describe('GET /auth/logout', () => {
        it('should successfully logout and destroy session', async () => {
            // First login to get session cookie
            const loginResponse = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'Password123'
                });
            
            const cookies = loginResponse.get('Set-Cookie');
            if (!cookies) {
                throw new Error('No cookies returned from login');
            }
            
            // Then logout
            const logoutResponse = await request(app.getHttpServer())
                .get('/auth/logout')
                .set('Cookie', cookies);
            
            expect(logoutResponse.status).toBe(200);
            expect(logoutResponse.body).toEqual({});
            
            // Verify session is destroyed by trying to access protected endpoint
            const sessionResponse = await request(app.getHttpServer())
                .get('/auth/sessionStatus')
                .set('Cookie', cookies);
            
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
            // Login
            const loginResponse = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'Password123'
                });
            
            const cookies = loginResponse.get('Set-Cookie');
            if (!cookies) {
                throw new Error('No cookies returned from login');
            }
            
            // Check session status
            const sessionResponse1 = await request(app.getHttpServer())
                .get('/auth/sessionStatus')
                .set('Cookie', cookies);
            
            expect(sessionResponse1.status).toBe(200);
            
            // Check session status again
            const sessionResponse2 = await request(app.getHttpServer())
                .get('/auth/sessionStatus')
                .set('Cookie', cookies);
            
            expect(sessionResponse2.status).toBe(200);
            
            // Logout
            const logoutResponse = await request(app.getHttpServer())
                .get('/auth/logout')
                .set('Cookie', cookies);
            
            expect(logoutResponse.status).toBe(200);
            
            // Verify session is destroyed
            const sessionResponse3 = await request(app.getHttpServer())
                .get('/auth/sessionStatus')
                .set('Cookie', cookies);
            
            expect(sessionResponse3.status).toBe(403);
        });
    });
});
