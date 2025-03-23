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
      return request(app.getHttpServer())
        .post('/exchanges')
        .set('Cookie', authCookie)
        .send({
          roomId: testRoom.id,
          playerId: testPlayer.id,
          amount: exchangeData.chipAmount / 10, // Use a smaller amount for testing
          type: exchangeData.buyInDirection,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.chipAmount).toBe(exchangeData.chipAmount / 10);
          expect(res.body.cashAmount).toBe((exchangeData.chipAmount / 10) * roomData.exchange); // chips * exchange rate
          expect(res.body.direction).toBe(exchangeData.buyInDirection);
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
          amount: exchangeData.chipAmount / 5,
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
          amount: exchangeData.chipAmount / 20, // Cash out only part of the chips
          type: exchangeData.cashOutDirection,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.chipAmount).toBe(exchangeData.chipAmount / 20);
          expect(res.body.cashAmount).toBe((exchangeData.chipAmount / 20) * roomData.exchange); // chips * exchange rate
          expect(res.body.direction).toBe(exchangeData.cashOutDirection);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/exchanges')
        .send({
          roomId: testRoom.id,
          playerId: testPlayer.id,
          amount: exchangeData.chipAmount,
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
              'amount must not be less than 1',
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
            expect.arrayContaining(['amount must not be less than 1']),
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
          amount: exchangeData.chipAmount / 10,
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
          amount: exchangeData.chipAmount, // More than the chips bought in
          type: exchangeData.cashOutDirection,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            `Cannot cash out ${exchangeData.chipAmount} chips. Player only has ${exchangeData.chipAmount / 10} chips.`,
          );
        });
    });

    it('should fail when player does not belong to the room', async () => {
      // Create another user and room
      const secondUserResult = await TestHelper.createTestUser(app, 'testuser2');
      const secondUser = secondUserResult.user;
      const secondUserCookie = secondUserResult.authCookie;

      // Create a room for the second user
      const secondRoom = await TestHelper.createTestRoom(app, secondUserCookie, secondUser.id);

      // Get the player from the second room
      const players2 = await playerRepository.find({
        where: { room: { id: secondRoom.id } },
        relations: ['room', 'user'],
      });

      const secondPlayer = players2[0];

      // Try to create an exchange with player from room1 and room2
      return request(app.getHttpServer())
        .post('/exchanges')
        .set('Cookie', authCookie)
        .send({
          roomId: testRoom.id,
          playerId: secondPlayer.id, // Player from room2
          amount: exchangeData.chipAmount,
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

      // Try to create an exchange in a closed room
      return request(app.getHttpServer())
        .post('/exchanges')
        .set('Cookie', authCookie)
        .send({
          roomId: testRoom.id,
          playerId: testPlayer.id,
          amount: exchangeData.chipAmount,
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
          amount: exchangeData.chipAmount,
          type: exchangeData.buyInDirection,
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
          amount: exchangeData.chipAmount,
          type: exchangeData.buyInDirection,
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('Could not find player with id: 9999');
        });
    });
  });
});
