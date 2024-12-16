import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module'; // Adjust the path as necessary
import { DataSource } from 'typeorm';
import { User } from 'src/typeorm';

describe('UserController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        const dataSource = app.get(DataSource);
        await dataSource.createQueryBuilder().delete().from(User).execute();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should create a user', async () => {
        const createUserDto = {
            username: 'testuser',
            password: 'testpassword',
        };

        const response = await request(app.getHttpServer())
            .post('/users')
            .send(createUserDto)
            .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.username).toEqual(createUserDto.username);
    });

    it('should fail to create a user with missing username', async () => {
        const createUserDto = {
            password: 'testpassword'
        };

        const response = await request(app.getHttpServer())
            .post('/users')
            .send(createUserDto)
            .expect(400);

        expect(response.body.message).toEqual(['username should not be empty']);
    });

    it('should fail to create a user with missing password', async () => {
        const createUserDto = {
            username: 'testuser'
        };

        const response = await request(app.getHttpServer())
            .post('/users')
            .send(createUserDto)
            .expect(400);

        expect(response.body.message).toEqual(['password should not be empty']);
    });

    it('should fail to create a user with existing username', async () => {
        const createUserDto = {
            username: 'testuser',
            password: 'testpassword',
        };

        const response = await request(app.getHttpServer())
            .post('/users')
            .send(createUserDto)
            .expect(409);

        expect(response.body.message).toEqual('User already exist');
    });
});
