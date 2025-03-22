import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Room } from '../src/typeorm/room.entity';
import { User } from '../src/typeorm/user.entity';
import { Repository } from 'typeorm';
import { E2EService } from '@app/e2e/e2e.service';
import { RoomStatusEnum } from '../src/room/types/RoomStatusEnum';
import { ExchangeDirectionEnum } from '../src/exchange/types/ExchangeDirectionEnum';
import * as session from 'express-session';
import * as passport from 'passport';

describe('RoomController (e2e)', () => {
    let app: INestApplication;
    let roomRepository: Repository<Room>;
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

        roomRepository = moduleFixture.get(getRepositoryToken(Room));
        userRepository = moduleFixture.get(getRepositoryToken(User));
        e2eService = moduleFixture.get(E2EService);
    });

    afterAll(async () => {
        await e2eService.clearDatabase();
        await app.close();
    });

    beforeEach(async () => {
        await e2eService.clearDatabase();

        // Create a test user and get auth cookie
        const createUserResponse = await request(app.getHttpServer())
            .post('/users')
            .send({
                username: 'testuser',
                password: 'Password123'
            });

        testUser = createUserResponse.body;

        // Login and get session cookie
        const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                username: 'testuser',
                password: 'Password123'
            })
            .expect(201);

        const cookies = loginResponse.get('Set-Cookie');
        if (!cookies) {
            throw new Error('No cookies returned from login');
        }
        authCookie = cookies;
    });

    describe('POST /rooms', () => {
        it('should create a new room', () => {
            return request(app.getHttpServer())
                .post('/rooms')
                .set('Cookie', authCookie)
                .send({
                    name: 'Test Room',
                    exchange: 100,
                    hostId: testUser.id
                })
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body.name).toBe('Test Room');
                    expect(res.body.exchange).toBe(100);
                    expect(res.body.status).toBe(RoomStatusEnum.Opened);
                    expect(res.body).toHaveProperty('createdAt');
                });
        });

        it('should validate room name length', () => {
            return request(app.getHttpServer())
                .post('/rooms')
                .set('Cookie', authCookie)
                .send({
                    name: '', // empty name
                    exchange: 100,
                    hostId: testUser.id
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toEqual(
                        expect.arrayContaining([
                            'Room name must be between 3 and 20 characters',
                            'Room name is required'
                        ])
                    );
                });
        });

        it('should validate exchange rate', () => {
            return request(app.getHttpServer())
                .post('/rooms')
                .set('Cookie', authCookie)
                .send({
                    name: 'Test Room',
                    exchange: -100, // negative exchange rate
                    hostId: testUser.id
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toEqual(
                        expect.arrayContaining([
                            'Exchange rate must be at least 1'
                        ])
                    );
                });
        });

        it('should require authentication', () => {
            return request(app.getHttpServer())
                .post('/rooms')
                .send({
                    name: 'Test Room',
                    exchange: 100,
                    hostId: testUser.id
                })
                .expect(403); // NestJS returns 403 for unauthorized requests
        });

        it('should require all required fields', () => {
            return request(app.getHttpServer())
                .post('/rooms')
                .set('Cookie', authCookie)
                .send({})
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toEqual(
                        expect.arrayContaining([
                            'Room name must be between 3 and 20 characters',
                            'Room name is required',
                            'Room name must be a string',
                            'Exchange rate must be at least 1',
                            'Exchange rate must be an integer',
                            'Host ID is required',
                            'Host ID must be an integer'
                        ])
                    );
                });
        });
    });

    describe('GET /rooms', () => {
        it('should get all rooms', async () => {
            // First create a room
            await request(app.getHttpServer())
                .post('/rooms')
                .set('Cookie', authCookie)
                .send({
                    name: 'Test Room',
                    exchange: 100,
                    hostId: testUser.id
                })
                .expect(201);

            // Then get all rooms
            return request(app.getHttpServer())
                .get('/rooms')
                .set('Cookie', authCookie)
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                    expect(res.body.length).toBe(1);
                    expect(res.body[0]).toHaveProperty('id');
                    expect(res.body[0].name).toBe('Test Room');
                    expect(res.body[0].exchange).toBe(100);
                    expect(res.body[0].status).toBe(RoomStatusEnum.Opened);
                });
        });

        it('should require authentication', () => {
            return request(app.getHttpServer())
                .get('/rooms')
                .expect(403);
        });
    });

    describe('GET /rooms/:id', () => {
        let testRoomId: number;

        beforeEach(async () => {
            // Create a test room
            const createResponse = await request(app.getHttpServer())
                .post('/rooms')
                .set('Cookie', authCookie)
                .send({
                    name: 'Test Room',
                    exchange: 100,
                    hostId: testUser.id
                });

            testRoomId = createResponse.body.id;
        });

        it('should get a room by id', () => {
            return request(app.getHttpServer())
                .get(`/rooms/${testRoomId}`)
                .set('Cookie', authCookie)
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id', testRoomId);
                    expect(res.body.name).toBe('Test Room');
                    expect(res.body.exchange).toBe(100);
                    expect(res.body.status).toBe(RoomStatusEnum.Opened);
                });
        });

        it('should return 404 for non-existent room', () => {
            return request(app.getHttpServer())
                .get('/rooms/999999')
                .set('Cookie', authCookie)
                .expect(404);
        });

        it('should require authentication', () => {
            return request(app.getHttpServer())
                .get(`/rooms/${testRoomId}`)
                .expect(403);
        });
    });

    describe('PUT /rooms/close/:id', () => {
        let testRoomId: number;
        let secondUser: User;
        let hostPlayer: any;
        let guestPlayer: any;

        beforeEach(async () => {
            // Create a test room
            const roomResponse = await request(app.getHttpServer())
                .post('/rooms')
                .set('Cookie', authCookie)
                .send({
                    name: 'Test Room',
                    exchange: 100,
                    hostId: testUser.id
                })
                .expect(201);

            testRoomId = roomResponse.body.id;

            // Create a second user
            const createUser2Response = await request(app.getHttpServer())
                .post('/users')
                .send({
                    username: 'testuser2',
                    password: 'Password123'
                });

            secondUser = createUser2Response.body;

            // Add the second user to the room
            const addPlayerResponse = await request(app.getHttpServer())
                .post('/players')
                .set('Cookie', authCookie)
                .send({
                    roomId: testRoomId,
                    userId: secondUser.id,
                    name: 'Guest Player'
                })
                .expect(201);

            guestPlayer = addPlayerResponse.body;

            // Get the room with players
            const roomWithPlayersResponse = await request(app.getHttpServer())
                .get(`/rooms/${testRoomId}`)
                .set('Cookie', authCookie)
                .expect(200);

            hostPlayer = roomWithPlayersResponse.body.players[0];
        });

        it('should close a room with balanced results', async () => {
            try {
                // Get the latest player data to ensure we have valid IDs
                const roomWithPlayersResponse = await request(app.getHttpServer())
                    .get(`/rooms/${testRoomId}`)
                    .set('Cookie', authCookie)
                    .expect(200);

                hostPlayer = roomWithPlayersResponse.body.players.find(p => p.role === 'host');
                guestPlayer = roomWithPlayersResponse.body.players.find(p => p.role === 'player');
                
                console.log('Host player:', hostPlayer);
                console.log('Guest player:', guestPlayer);
                
                // First create buy-in exchanges for both players
                const hostExchangeResponse = await request(app.getHttpServer())
                    .post('/exchanges')
                    .set('Cookie', authCookie)
                    .send({
                        roomId: testRoomId,
                        playerId: hostPlayer.id,
                        amount: 100,
                        type: ExchangeDirectionEnum.BuyIn
                    });
                
                console.log('Host exchange response status:', hostExchangeResponse.status);
                console.log('Host exchange response body:', hostExchangeResponse.body);
                
                const guestExchangeResponse = await request(app.getHttpServer())
                    .post('/exchanges')
                    .set('Cookie', authCookie)
                    .send({
                        roomId: testRoomId,
                        playerId: guestPlayer.id,
                        amount: 100,
                        type: ExchangeDirectionEnum.BuyIn
                    });
                
                console.log('Guest exchange response status:', guestExchangeResponse.status);
                console.log('Guest exchange response body:', guestExchangeResponse.body);
                
                // Let's also check the room status after exchanges
                const roomAfterExchangesResponse = await request(app.getHttpServer())
                    .get(`/rooms/${testRoomId}`)
                    .set('Cookie', authCookie)
                    .expect(200);
                
                console.log('Room after exchanges:', roomAfterExchangesResponse.body);
                
                // Then close the room - ensure total income is 0 (one player wins, one loses)
                const closeResponse = await request(app.getHttpServer())
                    .put(`/rooms/close/${testRoomId}`)
                    .set('Cookie', authCookie)
                    .send([
                        { id: hostPlayer.id, income: 50 },
                        { id: guestPlayer.id, income: -50 }
                    ]);
                
                console.log('Close room response status:', closeResponse.status);
                console.log('Close room response body:', closeResponse.body);
                
                expect(closeResponse.status).toBe(200);
                expect(closeResponse.body).toHaveProperty('id', testRoomId);
                expect(closeResponse.body.status).toBe('closed');
            } catch (error) {
                console.error('Test error:', error);
                throw error;
            }
        });

        it('should not close a room with unbalanced results', async () => {
            try {
                // Get the latest player data to ensure we have valid IDs
                const roomWithPlayersResponse = await request(app.getHttpServer())
                    .get(`/rooms/${testRoomId}`)
                    .set('Cookie', authCookie)
                    .expect(200);

                hostPlayer = roomWithPlayersResponse.body.players.find(p => p.role === 'host');
                guestPlayer = roomWithPlayersResponse.body.players.find(p => p.role === 'player');
                
                // First create buy-in exchanges for both players
                const hostExchangeResponse = await request(app.getHttpServer())
                    .post('/exchanges')
                    .set('Cookie', authCookie)
                    .send({
                        roomId: testRoomId,
                        playerId: hostPlayer.id,
                        amount: 100,
                        type: ExchangeDirectionEnum.BuyIn
                    });
                
                const guestExchangeResponse = await request(app.getHttpServer())
                    .post('/exchanges')
                    .set('Cookie', authCookie)
                    .send({
                        roomId: testRoomId,
                        playerId: guestPlayer.id,
                        amount: 100,
                        type: ExchangeDirectionEnum.BuyIn
                    });
                
                // Try to close the room with unbalanced results
                const closeResponse = await request(app.getHttpServer())
                    .put(`/rooms/close/${testRoomId}`)
                    .set('Cookie', authCookie)
                    .send([
                        { id: hostPlayer.id, income: 100 },
                        { id: guestPlayer.id, income: -50 }
                    ]);
                
                expect(closeResponse.status).toBe(400);
                expect(closeResponse.body.message).toBe('Cannot close room: total income and outcome must be equal to 0');
            } catch (error) {
                console.error('Test error:', error);
                throw error;
            }
        });

        it('should not close an already closed room', async () => {
            try {
                // Get the latest player data to ensure we have valid IDs
                const roomWithPlayersResponse = await request(app.getHttpServer())
                    .get(`/rooms/${testRoomId}`)
                    .set('Cookie', authCookie)
                    .expect(200);

                hostPlayer = roomWithPlayersResponse.body.players.find(p => p.role === 'host');
                guestPlayer = roomWithPlayersResponse.body.players.find(p => p.role === 'player');
                
                // First create buy-in exchanges for both players
                const hostExchangeResponse = await request(app.getHttpServer())
                    .post('/exchanges')
                    .set('Cookie', authCookie)
                    .send({
                        roomId: testRoomId,
                        playerId: hostPlayer.id,
                        amount: 100,
                        type: ExchangeDirectionEnum.BuyIn
                    });
                
                const guestExchangeResponse = await request(app.getHttpServer())
                    .post('/exchanges')
                    .set('Cookie', authCookie)
                    .send({
                        roomId: testRoomId,
                        playerId: guestPlayer.id,
                        amount: 100,
                        type: ExchangeDirectionEnum.BuyIn
                    });
                
                // First close the room
                const firstCloseResponse = await request(app.getHttpServer())
                    .put(`/rooms/close/${testRoomId}`)
                    .set('Cookie', authCookie)
                    .send([
                        { id: hostPlayer.id, income: 50 },
                        { id: guestPlayer.id, income: -50 }
                    ]);
                
                expect(firstCloseResponse.status).toBe(200);
                
                // Try to close it again
                const secondCloseResponse = await request(app.getHttpServer())
                    .put(`/rooms/close/${testRoomId}`)
                    .set('Cookie', authCookie)
                    .send([
                        { id: hostPlayer.id, income: 50 },
                        { id: guestPlayer.id, income: -50 }
                    ]);
                
                expect(secondCloseResponse.status).toBe(400);
                expect(secondCloseResponse.body.message).toBe('The room is already closed');
            } catch (error) {
                console.error('Test error:', error);
                throw error;
            }
        });

        it('should require authentication to close a room', async () => {
            try {
                // Get the latest player data to ensure we have valid IDs
                const roomWithPlayersResponse = await request(app.getHttpServer())
                    .get(`/rooms/${testRoomId}`)
                    .set('Cookie', authCookie)
                    .expect(200);

                hostPlayer = roomWithPlayersResponse.body.players.find(p => p.role === 'host');
                guestPlayer = roomWithPlayersResponse.body.players.find(p => p.role === 'player');
                
                // Try to close the room without authentication
                const closeResponse = await request(app.getHttpServer())
                    .put(`/rooms/close/${testRoomId}`)
                    .send([
                        { id: hostPlayer.id, income: 50 },
                        { id: guestPlayer.id, income: -50 }
                    ]);
                
                expect(closeResponse.status).toBe(403);
            } catch (error) {
                console.error('Test error:', error);
                throw error;
            }
        });

        it('should return 404 for non-existent room', async () => {
            try {
                // Try to close a non-existent room
                const closeResponse = await request(app.getHttpServer())
                    .put('/rooms/close/9999')
                    .set('Cookie', authCookie)
                    .send([
                        { id: hostPlayer.id, income: 50 },
                        { id: guestPlayer.id, income: -50 }
                    ]);
                
                expect(closeResponse.status).toBe(404);
                expect(closeResponse.body.message).toBe('Room with ID 9999 not found');
            } catch (error) {
                console.error('Test error:', error);
                throw error;
            }
        });
    });
});
