import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Room } from '../src/typeorm/room.entity';
import { User } from '../src/typeorm/user.entity';
import { Player } from '../src/typeorm/player.entity';
import { Repository } from 'typeorm';
import { E2EService } from '@app/e2e/e2e.service';
import { RoomStatusEnum } from '../src/room/types/RoomStatusEnum';
import { TestHelper } from './helpers/test-helper';
import { roomData, exchangeData } from './fixtures/test-data';
import * as currencyJs from 'currency.js';

describe('ExchangeController (e2e)', () => {
  let app: INestApplication;
  let roomRepository: Repository<Room>;
  let playerRepository: Repository<Player>;
  let e2eService: E2EService;
  let authCookie: string[];
  let testUser: User;
  let testRoom: Room;
  let testPlayer: Player;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await TestHelper.setupTestApp(moduleFixture);
    roomRepository = moduleFixture.get(getRepositoryToken(Room));
    playerRepository = moduleFixture.get(getRepositoryToken(Player));
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

    // Create a test room
    testRoom = await TestHelper.createTestRoom(app, authCookie, testUser.id);

    // Get the player (host) that was automatically created with the room
    const players = await playerRepository.find({
      where: { room: { id: testRoom.id } },
      relations: ['room', 'user'],
    });

    testPlayer = players[0];
  });

  describe('POST /exchanges', () => {
    it('should create a buy-in exchange successfully', () => {
      const amount = exchangeData.smallChipAmount;
      const expectedChipAmount = amount;
      const expectedCashAmount = currencyJs(amount).multiply(roomData.exchange).value;

      return request(app.getHttpServer())
        .post('/exchanges')
        .set('Cookie', authCookie)
        .send({
          roomId: testRoom.id,
          playerId: testPlayer.id,
          amount,
          type: exchangeData.buyInDirection,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(parseFloat(res.body.chipAmount)).toBeCloseTo(parseFloat(expectedChipAmount.toFixed(2)), 2);
          expect(parseFloat(res.body.cashAmount)).toBeCloseTo(parseFloat(expectedCashAmount.toFixed(2)), 2);
          expect(res.body.direction).toBe(exchangeData.buyInDirection);
          expect(res.body).toHaveProperty('createdAt');
        });
    });

    it('should create a cash-out exchange successfully after a buy-in', async () => {
      const buyInAmount = exchangeData.smallChipAmount;
      const cashOutAmount = currencyJs(buyInAmount).divide(2).value; // Cash out half of what was bought in
      const expectedCashAmount = currencyJs(cashOutAmount).divide(roomData.exchange).value;

      // First create a buy-in
      await request(app.getHttpServer())
        .post('/exchanges')
        .set('Cookie', authCookie)
        .send({
          roomId: testRoom.id,
          playerId: testPlayer.id,
          amount: buyInAmount,
          type: exchangeData.buyInDirection,
        })
        .expect(201);

      // Then create a cash-out
      return request(app.getHttpServer())
        .post('/exchanges')
        .set('Cookie', authCookie)
        .send({
          roomId: testRoom.id,
          playerId: testPlayer.id,
          amount: cashOutAmount,
          type: exchangeData.cashOutDirection,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(parseFloat(res.body.chipAmount)).toBeCloseTo(parseFloat(cashOutAmount.toFixed(2)), 2);
          expect(parseFloat(res.body.cashAmount)).toBeCloseTo(parseFloat(expectedCashAmount.toFixed(2)), 2);
          expect(res.body.direction).toBe(exchangeData.cashOutDirection);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/exchanges')
        .send({
          roomId: testRoom.id,
          playerId: testPlayer.id,
          amount: exchangeData.smallChipAmount,
          type: exchangeData.buyInDirection,
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
              'amount should not be empty',
              'type must be one of the following values: buyIn, cashOut',
              'type should not be empty',
            ]),
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
          amount: exchangeData.invalidChipAmount, // Negative amount
          type: exchangeData.buyInDirection,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(
            expect.arrayContaining(['amount must not be less than 0.01']),
          );
        });
    });

    it('should fail when trying to cash out more chips than available', async () => {
      const buyInAmount = exchangeData.smallChipAmount;
      const cashOutAmount = currencyJs(buyInAmount).multiply(2).value; // Try to cash out double what was bought in

      // First create a buy-in
      await request(app.getHttpServer())
        .post('/exchanges')
        .set('Cookie', authCookie)
        .send({
          roomId: testRoom.id,
          playerId: testPlayer.id,
          amount: buyInAmount,
          type: exchangeData.buyInDirection,
        })
        .expect(201);

      // Then try to cash out more chips than bought in
      return request(app.getHttpServer())
        .post('/exchanges')
        .set('Cookie', authCookie)
        .send({
          roomId: testRoom.id,
          playerId: testPlayer.id,
          amount: cashOutAmount, // More than the chips bought in
          type: exchangeData.cashOutDirection,
        })
        .expect(400);
    });

    it('should fail when player does not belong to the room', async () => {
      // Create another user and room
      const secondUserResult = await TestHelper.createTestUser(app, 'testuser2');
      const secondUser = secondUserResult.user;
      const secondUserCookie = secondUserResult.authCookie;

      const secondRoom = await TestHelper.createTestRoom(
        app,
        secondUserCookie,
        secondUser.id,
        'Second Test Room',
      );

      // Try to create exchange for player in first room but using second room ID
      return request(app.getHttpServer())
        .post('/exchanges')
        .set('Cookie', authCookie)
        .send({
          roomId: secondRoom.id,
          playerId: testPlayer.id,
          amount: exchangeData.smallChipAmount,
          type: exchangeData.buyInDirection,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Player does not belong to the specified room');
        });
    });

    it('should fail when room is closed', async () => {
      // Close the room
      await roomRepository.update(testRoom.id, { status: RoomStatusEnum.Closed });

      // Try to create exchange for closed room
      return request(app.getHttpServer())
        .post('/exchanges')
        .set('Cookie', authCookie)
        .send({
          roomId: testRoom.id,
          playerId: testPlayer.id,
          amount: exchangeData.smallChipAmount,
          type: exchangeData.buyInDirection,
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
          amount: exchangeData.smallChipAmount,
          type: exchangeData.buyInDirection,
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('Could not find room with id');
        });
    });

    it('should fail when player does not exist', () => {
      return request(app.getHttpServer())
        .post('/exchanges')
        .set('Cookie', authCookie)
        .send({
          roomId: testRoom.id,
          playerId: 9999, // Non-existent player ID
          amount: exchangeData.smallChipAmount,
          type: exchangeData.buyInDirection,
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('Could not find player with id');
        });
    });
  });

  describe('GET /exchanges/player/:playerId/balance', () => {
    it('should return the player balance', async () => {
      // Create buy-in and cash-out exchanges for testing
      const buyInAmount = exchangeData.smallChipAmount;
      const cashOutAmount = currencyJs(buyInAmount).divide(4).value; // Cash out a quarter of what was bought in
      const expectedBalance = currencyJs(buyInAmount).subtract(cashOutAmount).toString();

      // First create a buy-in
      await request(app.getHttpServer())
        .post('/exchanges')
        .set('Cookie', authCookie)
        .send({
          roomId: testRoom.id,
          playerId: testPlayer.id,
          amount: buyInAmount,
          type: exchangeData.buyInDirection,
        })
        .expect(201);

      // Then create a cash-out
      await request(app.getHttpServer())
        .post('/exchanges')
        .set('Cookie', authCookie)
        .send({
          roomId: testRoom.id,
          playerId: testPlayer.id,
          amount: cashOutAmount,
          type: exchangeData.cashOutDirection,
        })
        .expect(201);

      // Get the balance
      return request(app.getHttpServer())
        .get(`/exchanges/player/${testPlayer.id}/balance`)
        .set('Cookie', authCookie)
        .expect(200)
        .expect(res => {
          expect(parseFloat(res.body.balance)).toBeCloseTo(parseFloat(expectedBalance), 2);
        });
    });

    it('should return 0 for player with no exchanges', () => {
      return request(app.getHttpServer())
        .get(`/exchanges/player/${testPlayer.id}/balance`)
        .set('Cookie', authCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.balance).toBe('0');
        });
    });

    it('should fail when player does not exist', () => {
      return request(app.getHttpServer())
        .get('/exchanges/player/9999/balance') // Non-existent player ID
        .set('Cookie', authCookie)
        .expect(404);
    });
  });
});
