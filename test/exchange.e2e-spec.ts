import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Room } from '../src/typeorm/room.entity';
import { User } from '../src/typeorm/user.entity';
import { Player } from '../src/typeorm/player.entity';
import { Exchange } from '../src/typeorm/exchange.entity';
import { Repository } from 'typeorm';
import { E2EService } from '@app/e2e/e2e.service';
import { RoomStatusEnum } from '../src/room/types/RoomStatusEnum';
import { ExchangeDirectionEnum } from '../src/exchange/types/ExchangeDirectionEnum';
import * as session from 'express-session';
import * as passport from 'passport';
import { PlayerRoleEnum } from '@app/player/types/PlayerRoleEnum';

describe('ExchangeController (e2e)', () => {
    let app: INestApplication;
    let roomRepository: Repository<Room>;
    let userRepository: Repository<User>;
    let playerRepository: Repository<Player>;
    let exchangeRepository: Repository<Exchange>;
    let e2eService: E2EService;
    let authCookie: string[];
    let testUser: User;
    let testRoom: Room;
    let testPlayer: Player;

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
        playerRepository = moduleFixture.get(getRepositoryToken(Player));
        exchangeRepository = moduleFixture.get(getRepositoryToken(Exchange));
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

        // Create a test room
        const createRoomResponse = await request(app.getHttpServer())
            .post('/rooms')
            .set('Cookie', authCookie)
            .send({
                name: 'Test Room',
                exchange: 100, // 1 chip = 100 cash
                hostId: testUser.id
            })
            .expect(201);

        testRoom = createRoomResponse.body;

        // Get the player (host) that was automatically created with the room
        const players = await playerRepository.find({
            where: { room: { id: testRoom.id } },
            relations: ['room', 'user']
        });
        
        testPlayer = players[0];
    });

    describe('POST /exchanges', () => {
        it('should create a buy-in exchange successfully', () => {
            return request(app.getHttpServer())
                .post('/exchanges')
                .set('Cookie', authCookie)
                .send({
                    roomId: testRoom.id,
                    playerId: testPlayer.id,
                    amount: 10,
                    type: ExchangeDirectionEnum.BuyIn
                })
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body.chipAmount).toBe(10);
                    expect(res.body.cashAmount).toBe(1000); // 10 chips * 100 exchange rate
                    expect(res.body.direction).toBe(ExchangeDirectionEnum.BuyIn);
                    expect(res.body).toHaveProperty('createdAt');
                });
        });

        it('should create a cash-out exchange successfully after a buy-in', async () => {
            // First create a buy-in
            await request(app.getHttpServer())
                .post('/exchanges')
                .set('Cookie', authCookie)
                .send({
                    roomId: testRoom.id,
                    playerId: testPlayer.id,
                    amount: 20,
                    type: ExchangeDirectionEnum.BuyIn
                })
                .expect(201);

            // Then create a cash-out
            return request(app.getHttpServer())
                .post('/exchanges')
                .set('Cookie', authCookie)
                .send({
                    roomId: testRoom.id,
                    playerId: testPlayer.id,
                    amount: 5, // Cash out only part of the chips
                    type: ExchangeDirectionEnum.CashOut
                })
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body.chipAmount).toBe(5);
                    expect(res.body.cashAmount).toBe(500); // 5 chips * 100 exchange rate
                    expect(res.body.direction).toBe(ExchangeDirectionEnum.CashOut);
                });
        });

        it('should require authentication', () => {
            return request(app.getHttpServer())
                .post('/exchanges')
                .send({
                    roomId: testRoom.id,
                    playerId: testPlayer.id,
                    amount: 10,
                    type: ExchangeDirectionEnum.BuyIn
                })
                .expect(403); // NestJS returns 403 for unauthorized requests
        });

        it('should validate required fields', () => {
            return request(app.getHttpServer())
                .post('/exchanges')
                .set('Cookie', authCookie)
                .send({})
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toEqual(
                        expect.arrayContaining([
                            'roomId must not be less than 1',
                            'roomId should not be empty',
                            'playerId should not be empty',
                            'amount must not be less than 1',
                            'amount should not be empty',
                            'type must be one of the following values: buyIn, cashOut',
                            'type should not be empty'
                        ])
                    );
                });
        });

        it('should validate amount is positive', () => {
            return request(app.getHttpServer())
                .post('/exchanges')
                .set('Cookie', authCookie)
                .send({
                    roomId: testRoom.id,
                    playerId: testPlayer.id,
                    amount: -10, // Negative amount
                    type: ExchangeDirectionEnum.BuyIn
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toEqual(
                        expect.arrayContaining([
                            'amount must not be less than 1'
                        ])
                    );
                });
        });

        it('should fail when trying to cash out more chips than available', async () => {
            // First create a buy-in
            await request(app.getHttpServer())
                .post('/exchanges')
                .set('Cookie', authCookie)
                .send({
                    roomId: testRoom.id,
                    playerId: testPlayer.id,
                    amount: 10,
                    type: ExchangeDirectionEnum.BuyIn
                })
                .expect(201);

            // Then try to cash out more chips than bought in
            return request(app.getHttpServer())
                .post('/exchanges')
                .set('Cookie', authCookie)
                .send({
                    roomId: testRoom.id,
                    playerId: testPlayer.id,
                    amount: 20, // More than the 10 chips bought in
                    type: ExchangeDirectionEnum.CashOut
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain('Cannot cash out 20 chips. Player only has 10 chips.');
                });
        });

        it('should fail when player does not belong to the room', async () => {
            // Create another user and room
            const createUser2Response = await request(app.getHttpServer())
                .post('/users')
                .send({
                    username: 'testuser2',
                    password: 'Password123'
                });

            const user2 = createUser2Response.body;

            // Login as user2
            const loginResponse = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: 'testuser2',
                    password: 'Password123'
                });

            const user2Cookies = loginResponse.get('Set-Cookie');
            if (!user2Cookies) {
                throw new Error('No cookies returned from login');
            }

            // Create a room for user2
            const createRoom2Response = await request(app.getHttpServer())
                .post('/rooms')
                .set('Cookie', user2Cookies as string[])
                .send({
                    name: 'Test Room 2',
                    exchange: 100,
                    hostId: user2.id
                })
                .expect(201);

            const room2 = createRoom2Response.body;

            // Get the player from room2
            const players2 = await playerRepository.find({
                where: { room: { id: room2.id } },
                relations: ['room', 'user']
            });
            
            const player2 = players2[0];

            // Try to create an exchange with player from room1 and room2
            return request(app.getHttpServer())
                .post('/exchanges')
                .set('Cookie', authCookie)
                .send({
                    roomId: testRoom.id,
                    playerId: player2.id, // Player from room2
                    amount: 10,
                    type: ExchangeDirectionEnum.BuyIn
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain('Player does not belong to the specified room');
                });
        });

        it('should fail when room is closed', async () => {
            // Close the room
            await roomRepository.update(testRoom.id, { status: RoomStatusEnum.Closed });

            // Try to create an exchange in a closed room
            return request(app.getHttpServer())
                .post('/exchanges')
                .set('Cookie', authCookie)
                .send({
                    roomId: testRoom.id,
                    playerId: testPlayer.id,
                    amount: 10,
                    type: ExchangeDirectionEnum.BuyIn
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toContain('Cannot create exchange because the room is closed');
                });
        });

        it('should fail when room does not exist', () => {
            return request(app.getHttpServer())
                .post('/exchanges')
                .set('Cookie', authCookie)
                .send({
                    roomId: 9999, // Non-existent room ID
                    playerId: testPlayer.id,
                    amount: 10,
                    type: ExchangeDirectionEnum.BuyIn
                })
                .expect(404)
                .expect((res) => {
                    expect(res.body.message).toContain('Could not find room with id: 9999');
                });
        });

        it('should fail when player does not exist', () => {
            return request(app.getHttpServer())
                .post('/exchanges')
                .set('Cookie', authCookie)
                .send({
                    roomId: testRoom.id,
                    playerId: 9999, // Non-existent player ID
                    amount: 10,
                    type: ExchangeDirectionEnum.BuyIn
                })
                .expect(404)
                .expect((res) => {
                    expect(res.body.message).toContain('Could not find player with id: 9999');
                });
        });
    });
});
