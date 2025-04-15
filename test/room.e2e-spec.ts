import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Room } from '../src/typeorm/room.entity';
import { User } from '../src/typeorm/user.entity';
import { E2EService } from '@app/e2e/e2e.service';
import { RoomStatusEnum } from '../src/room/types/RoomStatusEnum';
import { ExchangeDirectionEnum } from '../src/exchange/types/ExchangeDirectionEnum';
import { TestHelper } from './helpers/test-helper';
import { roomData, exchangeData, roomClosingData } from './fixtures/test-data';
import * as currencyJs from 'currency.js';

describe('RoomController (e2e)', () => {
  let app: INestApplication;
  let e2eService: E2EService;
  let authCookie: string[];
  let testUser: User;

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
    await e2eService.clearDatabase();

    // Create a test user and get auth cookie
    const userResult = await TestHelper.createTestUser(app);
    testUser = userResult.user;
    authCookie = userResult.authCookie;
  });

  describe('POST /rooms', () => {
    it('should create a new room', () => {
      return request(app.getHttpServer())
        .post('/rooms')
        .set('Cookie', authCookie)
        .send({
          name: roomData.name,
          exchange: roomData.exchange,
          hostId: testUser.id,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(roomData.name);
          expect(res.body.exchange).toBe(roomData.exchange);
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
          exchange: roomData.exchange,
          hostId: testUser.id,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining([
              'Room name must be between 3 and 20 characters',
              'Room name is required',
            ]),
          );
        });
    });

    it('should validate exchange rate', () => {
      return request(app.getHttpServer())
        .post('/rooms')
        .set('Cookie', authCookie)
        .send({
          name: roomData.name,
          exchange: roomData.invalidExchange, // negative exchange rate
          hostId: testUser.id,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining(['Exchange rate must be at least 1']),
          );
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/rooms')
        .send({
          name: roomData.name,
          exchange: roomData.exchange,
          hostId: testUser.id,
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
              'Host ID must be an integer',
            ]),
          );
        });
    });
  });

  describe('GET /rooms', () => {
    it('should get all rooms', async () => {
      // First create a room
      await TestHelper.createTestRoom(app, authCookie, testUser.id);

      // Then get all rooms
      return request(app.getHttpServer())
        .get('/rooms')
        .set('Cookie', authCookie)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0].name).toBe(roomData.name);
          expect(res.body[0].exchange).toBe(roomData.exchange);
          expect(res.body[0].status).toBe(RoomStatusEnum.Opened);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer()).get('/rooms').expect(403);
    });
  });

  describe('GET /rooms/:id', () => {
    let testRoom: Room;

    beforeEach(async () => {
      // Create a test room
      testRoom = await TestHelper.createTestRoom(app, authCookie, testUser.id);
    });

    it('should get a room by id', () => {
      return request(app.getHttpServer())
        .get(`/rooms/${testRoom.id}`)
        .set('Cookie', authCookie)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testRoom.id);
          expect(res.body.name).toBe(roomData.name);
          expect(res.body.exchange).toBe(roomData.exchange);
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
      return request(app.getHttpServer()).get(`/rooms/${testRoom.id}`).expect(403);
    });
  });

  describe('PUT /rooms/close/:id', () => {
    let testRoom: Room;
    let secondUser: User;
    let hostPlayer: any;
    let guestPlayer: any;

    beforeEach(async () => {
      // Create a test room
      testRoom = await TestHelper.createTestRoom(app, authCookie, testUser.id);

      // Create a second user
      const secondUserResult = await TestHelper.createTestUser(app, 'testuser2');
      secondUser = secondUserResult.user;

      // Get the room with players to find the host player
      const roomResponse = await request(app.getHttpServer())
        .get(`/rooms/${testRoom.id}`)
        .set('Cookie', authCookie)
        .expect(200);

      hostPlayer = roomResponse.body.players.find((p) => p.role === 'host');

      // Add the second user to the room as a player
      const addPlayerResponse = await request(app.getHttpServer())
        .post('/players')
        .set('Cookie', authCookie)
        .send({
          roomId: testRoom.id,
          userId: secondUser.id,
          name: 'Guest Player',
        })
        .expect(201);

      guestPlayer = addPlayerResponse.body;
    });

    it('should close a room with balanced results', async () => {
      // Get the latest player data to ensure we have valid IDs
      const roomWithPlayersResponse = await request(app.getHttpServer())
        .get(`/rooms/${testRoom.id}`)
        .set('Cookie', authCookie)
        .expect(200);

      hostPlayer = roomWithPlayersResponse.body.players.find((p) => p.role === 'host');
      guestPlayer = roomWithPlayersResponse.body.players.find((p) => p.role === 'player');

      // First create buy-in exchanges for both players
      await request(app.getHttpServer()).post('/exchanges').set('Cookie', authCookie).send({
        roomId: testRoom.id,
        playerId: hostPlayer.id,
        amount: exchangeData.smallChipAmount,
        type: ExchangeDirectionEnum.BuyIn,
      });

      await request(app.getHttpServer()).post('/exchanges').set('Cookie', authCookie).send({
        roomId: testRoom.id,
        playerId: guestPlayer.id,
        amount: exchangeData.smallChipAmount,
        type: ExchangeDirectionEnum.BuyIn,
      });

      // Generate balanced results
      const balancedResults = roomClosingData.balancedResults(hostPlayer.id, guestPlayer.id);

      // Then close the room - ensure total income is 0 (one player wins, one loses)
      const closeResponse = await request(app.getHttpServer())
        .put(`/rooms/close/${testRoom.id}`)
        .set('Cookie', authCookie)
        .send(balancedResults);

      expect(closeResponse.status).toBe(200);
      expect(closeResponse.body).toHaveProperty('id', testRoom.id);
      expect(closeResponse.body.status).toBe('closed');
    });

    it('should not close a room with unbalanced results', async () => {
      // Get the latest player data to ensure we have valid IDs
      const roomWithPlayersResponse = await request(app.getHttpServer())
        .get(`/rooms/${testRoom.id}`)
        .set('Cookie', authCookie)
        .expect(200);

      hostPlayer = roomWithPlayersResponse.body.players.find((p) => p.role === 'host');
      guestPlayer = roomWithPlayersResponse.body.players.find((p) => p.role === 'player');

      // First create buy-in exchanges for both players
      await request(app.getHttpServer()).post('/exchanges').set('Cookie', authCookie).send({
        roomId: testRoom.id,
        playerId: hostPlayer.id,
        amount: exchangeData.smallChipAmount,
        type: ExchangeDirectionEnum.BuyIn,
      });

      await request(app.getHttpServer()).post('/exchanges').set('Cookie', authCookie).send({
        roomId: testRoom.id,
        playerId: guestPlayer.id,
        amount: exchangeData.smallChipAmount,
        type: ExchangeDirectionEnum.BuyIn,
      });

      // Generate unbalanced results
      const unbalancedResults = roomClosingData.unbalancedResults(hostPlayer.id, guestPlayer.id);

      // Try to close the room with unbalanced results
      const closeResponse = await request(app.getHttpServer())
        .put(`/rooms/close/${testRoom.id}`)
        .set('Cookie', authCookie)
        .send(unbalancedResults);

      expect(closeResponse.status).toBe(400);
      expect(closeResponse.body.message).toBe(
        'Cannot close room: total income and outcome must be equal to 0',
      );
    });

    it('should not close an already closed room', async () => {
      // Get the latest player data to ensure we have valid IDs
      const roomWithPlayersResponse = await request(app.getHttpServer())
        .get(`/rooms/${testRoom.id}`)
        .set('Cookie', authCookie)
        .expect(200);

      hostPlayer = roomWithPlayersResponse.body.players.find((p) => p.role === 'host');
      guestPlayer = roomWithPlayersResponse.body.players.find((p) => p.role === 'player');

      // First create buy-in exchanges for both players
      await request(app.getHttpServer()).post('/exchanges').set('Cookie', authCookie).send({
        roomId: testRoom.id,
        playerId: hostPlayer.id,
        amount: exchangeData.smallChipAmount,
        type: ExchangeDirectionEnum.BuyIn,
      });

      await request(app.getHttpServer()).post('/exchanges').set('Cookie', authCookie).send({
        roomId: testRoom.id,
        playerId: guestPlayer.id,
        amount: exchangeData.smallChipAmount,
        type: ExchangeDirectionEnum.BuyIn,
      });

      // Generate balanced results
      const balancedResults = roomClosingData.balancedResults(hostPlayer.id, guestPlayer.id);

      // First close the room
      const firstCloseResponse = await request(app.getHttpServer())
        .put(`/rooms/close/${testRoom.id}`)
        .set('Cookie', authCookie)
        .send(balancedResults);

      expect(firstCloseResponse.status).toBe(200);

      // Try to close it again
      const secondCloseResponse = await request(app.getHttpServer())
        .put(`/rooms/close/${testRoom.id}`)
        .set('Cookie', authCookie)
        .send(balancedResults);

      expect(secondCloseResponse.status).toBe(400);
      expect(secondCloseResponse.body.message).toBe('The room is already closed');
    });

    it('should require authentication to close a room', async () => {
      // Get the latest player data to ensure we have valid IDs
      const roomWithPlayersResponse = await request(app.getHttpServer())
        .get(`/rooms/${testRoom.id}`)
        .set('Cookie', authCookie)
        .expect(200);

      hostPlayer = roomWithPlayersResponse.body.players.find((p) => p.role === 'host');
      guestPlayer = roomWithPlayersResponse.body.players.find((p) => p.role === 'player');

      // Generate balanced results
      const balancedResults = roomClosingData.balancedResults(hostPlayer.id, guestPlayer.id);

      // Try to close the room without authentication
      const closeResponse = await request(app.getHttpServer())
        .put(`/rooms/close/${testRoom.id}`)
        .send(balancedResults);

      expect(closeResponse.status).toBe(403);
    });

    it('should return 404 for non-existent room', async () => {
      // Generate balanced results
      const balancedResults = roomClosingData.balancedResults(hostPlayer.id, guestPlayer.id);

      // Try to close a non-existent room
      const closeResponse = await request(app.getHttpServer())
        .put('/rooms/close/9999')
        .set('Cookie', authCookie)
        .send(balancedResults);

      expect(closeResponse.status).toBe(404);
    });
  });
});
