import { Test, TestingModule } from '@nestjs/testing';
import { RoomService } from './room.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Room } from '@entities/room.entity';
import { PlayerService } from '@app/player/player.service';
import { UserService } from '@app/user/user.service';
import { ExchangeService } from '@app/exchange/exchange.service';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './types/CreateRoomDto';
import { RoomStatusEnum } from './types/RoomStatusEnum';
import { PlayerRoleEnum } from '@app/player/types/PlayerRoleEnum';
import { ExchangeDirectionEnum } from '@app/exchange/types/ExchangeDirectionEnum';
import { Player } from '@entities/player.entity';
import { Exchange } from '@app/typeorm/exchange.entity';
import { User } from '@entities/user.entity';
import * as currencyJs from 'currency.js';

// Mock class-transformer
jest.mock('class-transformer', () => ({
  plainToInstance: jest.fn((cls, obj) => obj),
  Expose: () => jest.fn(),
  Exclude: () => jest.fn(),
  Transform: () => jest.fn(),
}));

describe('RoomService', () => {
  let service: RoomService;
  let roomRepository: Repository<Room>;
  let playerService: PlayerService;
  let userService: UserService;
  let exchangeService: ExchangeService;

  const mockDate = new Date();

  // Create mock objects with proper circular references
  const mockRoom = new Room();
  Object.assign(mockRoom, {
    id: 1,
    name: 'Test Room',
    exchange: 100,
    status: RoomStatusEnum.Opened,
    players: [],
    createdAt: mockDate,
    updatedAt: mockDate,
  });

  const mockUser = new User();
  Object.assign(mockUser, {
    id: 1,
    username: 'testuser',
    password: 'hashedpassword',
    players: [],
    createdAt: mockDate,
    updatedAt: mockDate,
  });

  const mockExchange = new Exchange();
  Object.assign(mockExchange, {
    id: 1,
    chipAmount: 100.00,
    cashAmount: 10000.00,
    direction: ExchangeDirectionEnum.BuyIn,
    room: mockRoom,
    createdAt: mockDate,
    updatedAt: mockDate,
  });

  const mockPlayer = new Player();
  Object.assign(mockPlayer, {
    id: 1,
    name: 'testuser',
    role: PlayerRoleEnum.Player,
    room: mockRoom,
    user: mockUser,
    exchanges: [mockExchange],
    createdAt: mockDate,
    updatedAt: mockDate,
  });

  // Set up circular references
  mockRoom.players = [mockPlayer];
  mockUser.players = [mockPlayer];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        {
          provide: getRepositoryToken(Room),
          useValue: {
            find: jest.fn().mockResolvedValue([mockRoom]),
            findOne: jest.fn().mockResolvedValue(mockRoom),
            create: jest.fn().mockReturnValue(mockRoom),
            save: jest.fn().mockResolvedValue(mockRoom),
            update: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: PlayerService,
          useValue: {
            createPlayer: jest.fn().mockResolvedValue(mockPlayer),
            changeRole: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: UserService,
          useValue: {
            getUserById: jest.fn().mockResolvedValue(mockUser),
          },
        },
        {
          provide: ExchangeService,
          useValue: {
            createExchange: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<RoomService>(RoomService);
    roomRepository = module.get<Repository<Room>>(getRepositoryToken(Room));
    playerService = module.get<PlayerService>(PlayerService);
    userService = module.get<UserService>(UserService);
    exchangeService = module.get<ExchangeService>(ExchangeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAll', () => {
    it('should return an array of rooms', async () => {
      const result = await service.getAll();
      expect(result).toEqual([mockRoom]);
      expect(roomRepository.find).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const createRoomDto: CreateRoomDto = {
      name: 'Test Room',
      exchange: 100,
      hostId: 1,
    };

    it('should create a room successfully', async () => {
      const result = await service.create(createRoomDto);
      expect(result).toEqual(mockRoom);
      expect(userService.getUserById).toHaveBeenCalledWith(createRoomDto.hostId);
      expect(roomRepository.create).toHaveBeenCalled();
      expect(roomRepository.save).toHaveBeenCalled();
      expect(playerService.createPlayer).toHaveBeenCalled();
      expect(playerService.changeRole).toHaveBeenCalled();
    });

    it('should throw BadRequestException if host not found', async () => {
      jest.spyOn(userService, 'getUserById').mockRejectedValue(new NotFoundException());
      await expect(service.create(createRoomDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should return a room if found', async () => {
      const result = await service.findById(1);
      expect(result).toEqual(mockRoom);
      expect(roomRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['players', 'players.exchanges'],
      });
    });

    it('should throw NotFoundException if room not found', async () => {
      jest.spyOn(roomRepository, 'findOne').mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('close', () => {
    const mockPlayersResults = [{ id: 1, income: 100.50 }];

    beforeEach(() => {
      // Update mockPlayer exchange to match the expected income
      mockExchange.chipAmount = 100.50;
    });

    it('should close room successfully when balance is zero', async () => {
      // Mock the calculate methods to return balanced values
      jest.spyOn(service as any, 'calculateTotalBalance').mockResolvedValue(currencyJs('100.50'));
      jest.spyOn(service as any, 'calculateTotalBuyIn').mockResolvedValue(currencyJs('100.50'));

      const result = await service.close(1, mockPlayersResults);
      expect(result).toEqual(mockRoom);
      expect(roomRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        { status: RoomStatusEnum.Closed },
      );
    });

    it('should throw BadRequestException if room is already closed', async () => {
      const closedRoom = new Room();
      Object.assign(closedRoom, {
        ...mockRoom,
        status: RoomStatusEnum.Closed,
      });
      jest.spyOn(roomRepository, 'findOne').mockResolvedValue(closedRoom);

      await expect(service.close(1, mockPlayersResults)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if balance is not zero', async () => {
      const unbalancedResults = [
        { id: 1, income: 100.50 },
        { id: 2, income: -50.25 },
      ];

      // Mock the calculate methods to return unbalanced values
      jest.spyOn(service as any, 'calculateTotalBalance').mockResolvedValue(currencyJs('50.25'));
      jest.spyOn(service as any, 'calculateTotalBuyIn').mockResolvedValue(currencyJs('100.50'));

      await expect(service.close(1, unbalancedResults)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no player results provided', async () => {
      await expect(service.close(1, [])).rejects.toThrow(BadRequestException);
    });
  });
});
