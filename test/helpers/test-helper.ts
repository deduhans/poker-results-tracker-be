import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as session from 'express-session';
import * as passport from 'passport';
import { User } from '../../src/typeorm/user.entity';
import { Room } from '../../src/typeorm/room.entity';
import { Player } from '../../src/typeorm/player.entity';
import { Exchange } from '../../src/typeorm/exchange.entity';
import { Repository } from 'typeorm';
import { E2EService } from '../../src/e2e/e2e.service';
import { PlayerRoleEnum } from '../../src/player/types/PlayerRoleEnum';
import { ExchangeDirectionEnum } from '../../src/exchange/types/ExchangeDirectionEnum';

export class TestHelper {
  /**
   * Sets up a test application with standard configuration
   */
  static async setupTestApp(moduleFixture: TestingModule): Promise<INestApplication> {
    const app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    // Set up session middleware
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
      }),
    );
    app.use(passport.initialize());
    app.use(passport.session());

    await app.init();
    return app;
  }

  /**
   * Creates a test user and returns the user object
   */
  static async createTestUser(
    app: INestApplication,
    username = 'testuser',
    password = 'Password123',
  ): Promise<{ user: User; authCookie: string[] }> {
    // Create user
    const createUserResponse = await request(app.getHttpServer()).post('/users').send({
      username,
      password,
    });

    const user = createUserResponse.body;

    // Login and get session cookie
    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      username,
      password,
    });

    const authCookie = loginResponse.get('Set-Cookie');

    if (!authCookie) {
      throw new Error('No auth cookie returned from login');
    }

    return { user, authCookie };
  }

  /**
   * Creates a test room and returns the room object
   */
  static async createTestRoom(
    app: INestApplication,
    authCookie: string[],
    hostId?: number,
    name = 'Test Room',
    exchange = 100,
  ): Promise<Room> {
    const response = await request(app.getHttpServer())
      .post('/rooms')
      .set('Cookie', authCookie)
      .send({
        name,
        exchange,
        hostId,
      });

    return response.body;
  }

  /**
   * Creates a test player in a room
   */
  static async createTestPlayer(
    app: INestApplication,
    authCookie: string[],
    roomId: number,
    name = 'Guest Player',
    role = PlayerRoleEnum.Player,
  ): Promise<Player> {
    const response = await request(app.getHttpServer())
      .post('/players')
      .set('Cookie', authCookie)
      .send({
        name,
        roomId,
        role,
      });

    return response.body;
  }

  /**
   * Creates a buy-in exchange for a player
   */
  static async createBuyInExchange(
    app: INestApplication,
    authCookie: string[],
    playerId: number,
    chipAmount = 100,
  ): Promise<Exchange> {
    const response = await request(app.getHttpServer())
      .post('/exchanges')
      .set('Cookie', authCookie)
      .send({
        playerId,
        direction: ExchangeDirectionEnum.BuyIn,
        chipAmount,
      });

    return response.body;
  }

  /**
   * Creates a cash-out exchange for a player
   */
  static async createCashOutExchange(
    app: INestApplication,
    authCookie: string[],
    playerId: number,
    chipAmount = 100,
  ): Promise<Exchange> {
    const response = await request(app.getHttpServer())
      .post('/exchanges')
      .set('Cookie', authCookie)
      .send({
        playerId,
        direction: ExchangeDirectionEnum.CashOut,
        chipAmount,
      });

    return response.body;
  }

  /**
   * Closes a room with the given player results
   */
  static async closeRoom(
    app: INestApplication,
    authCookie: string[],
    roomId: number,
    playersResults: { id: number; income: number }[],
  ): Promise<Room> {
    const response = await request(app.getHttpServer())
      .put(`/rooms/close/${roomId}`)
      .set('Cookie', authCookie)
      .send(playersResults);

    return response.body;
  }

  /**
   * Gets repositories and services from the module fixture
   */
  static getRepositories(moduleFixture: TestingModule): {
    roomRepository: Repository<Room>;
    userRepository: Repository<User>;
    playerRepository: Repository<Player>;
    exchangeRepository: Repository<Exchange>;
    e2eService: E2EService;
  } {
    return {
      roomRepository: moduleFixture.get(Repository<Room>),
      userRepository: moduleFixture.get(Repository<User>),
      playerRepository: moduleFixture.get(Repository<Player>),
      exchangeRepository: moduleFixture.get(Repository<Exchange>),
      e2eService: moduleFixture.get(E2EService),
    };
  }
}
