import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthDto } from 'src/auth/types/AuthDto';
import { DataSource } from 'typeorm';
import { User } from 'src/typeorm';
import { getBaseAuth, getBaseUser } from './data/user';
import { UserService } from 'src/user/user.service';
import { CreateUserDto } from 'src/user/types/CreateUserDto';
import * as session from "express-session";
import * as passport from "passport";


describe('Auth E2E', () => {
    let app: INestApplication;
    let userService: UserService;
    let newUser: CreateUserDto;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        app.use(
            session({
                secret: "keyboard",
                resave: false,
                saveUninitialized: false,
            })
        );
        app.use(passport.initialize());
        app.use(passport.session());
        await app.init();

        const dataSource = app.get(DataSource);
        await dataSource.createQueryBuilder().delete().from(User).execute();

        userService = moduleFixture.get(UserService);
        newUser = getBaseUser();
        await userService.createUser(newUser);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Login', () => {
        it('should successfully log in a user', async () => {
            const auth: AuthDto = getBaseAuth();

            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send(auth);

            expect(response.status).toBe(201);
            expect(response.headers['set-cookie']).toBeDefined();
            expect(response.body.message).toEqual('User logged in');
        });

        it('should return an error for invalid credentials', async () => {
            const auth: AuthDto = {
                username: 'invaliduser',
                password: 'invalidpassword',
            };

            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send(auth);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Could not find the user: ' + auth.username);
        });
    });

    describe('Logout', () => {
        let sessionId: string;

        beforeEach(async () => {
            const auth: AuthDto = getBaseAuth();
            const loginResponse = await request(app.getHttpServer())
                .post('/auth/login')
                .send(auth);

            sessionId = loginResponse.headers['set-cookie'].toString().split(";")[0];
        });

        it('should successfully log out a user', async () => {
            const response = await request(app.getHttpServer())
                .get('/auth/logout')
                .set('Cookie', sessionId);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Logged out successfully');
        });
    });
});
