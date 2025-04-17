import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeService } from './exchange.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Exchange } from '@entities/exchange.entity';
import { Player } from '@entities/player.entity';
import { Room } from '@entities/room.entity';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateExchangeDto } from './types/CreateExchangeDto';
import { RoomStatusEnum } from '@app/room/types/RoomStatusEnum';
import { ExchangeDirectionEnum } from './types/ExchangeDirectionEnum';
import { PlayerRoleEnum } from '@app/player/types/PlayerRoleEnum';

// Mock Exchange class
class MockExchange {
  player: any;
  direction: ExchangeDirectionEnum;
  chipAmount: number;
  cashAmount: number;
  id = 1;
  createdAt = new Date();
  updatedAt = new Date();
}

describe('ExchangeService', () => {
  let service: ExchangeService;
  let exchangeRepository: Repository<Exchange>;
  let playerRepository: Repository<Player>;
  let roomRepository: Repository<Room>;

  const mockDate = new Date();

  // Create mock objects with proper circular references
  const mockRoom: any = {
    id: 1,
    name: 'Test Room',
    exchange: 100, // 1 chip = 100 cash
    status: RoomStatusEnum.Opened,
    players: [],
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockExchange: any = {
    id: 1,
    player: null, // Will be set later
    direction: ExchangeDirectionEnum.BuyIn,
    chipAmount: 10,
    cashAmount: 1000, // 10 chips * 100 exchange rate
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockPlayer: any = {
    id: 1,
    name: 'Test Player',
    role: PlayerRoleEnum.Player,
    room: mockRoom,
    exchanges: [mockExchange],
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  // Set up circular references
  mockExchange.player = mockPlayer;
  mockRoom.players = [mockPlayer];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeService,
        {
          provide: getRepositoryToken(Exchange),
          useValue: {
            save: jest.fn().mockImplementation(entity => {
              return Promise.resolve({
                ...mockExchange,
                ...entity
              });
            }),
          },
        },
        {
          provide: getRepositoryToken(Player),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockPlayer),
          },
        },
        {
          provide: getRepositoryToken(Room),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockRoom),
          },
        },
      ],
    }).compile();

    service = module.get<ExchangeService>(ExchangeService);
    exchangeRepository = module.get<Repository<Exchange>>(getRepositoryToken(Exchange));
    playerRepository = module.get<Repository<Player>>(getRepositoryToken(Player));
    roomRepository = module.get<Repository<Room>>(getRepositoryToken(Room));

    // Mock the Exchange implementation
    jest.spyOn(service, 'createExchange').mockImplementation(async (dto: CreateExchangeDto) => {
      const exchange = new MockExchange();
      exchange.player = mockPlayer;
      exchange.direction = dto.type;

      if (dto.type === ExchangeDirectionEnum.BuyIn) {
        exchange.cashAmount = dto.amount;
        exchange.chipAmount = dto.amount * mockRoom.exchange;
      } else {
        exchange.chipAmount = dto.amount;
        exchange.cashAmount = dto.amount / mockRoom.exchange;
      }

      return exchange as unknown as Exchange;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createExchange', () => {
    const createExchangeDto: CreateExchangeDto = {
      roomId: 1,
      playerId: 1,
      amount: 10,
      type: ExchangeDirectionEnum.BuyIn,
    };

    it('should create a buy-in exchange successfully', async () => {
      // Restore original implementation for this test
      jest.spyOn(service, 'createExchange').mockRestore();

      // Set up mocks for service dependencies
      jest.spyOn(exchangeRepository, 'save').mockResolvedValue(mockExchange);

      const result = await service.createExchange(createExchangeDto);

      expect(result).toBeDefined();
      expect(roomRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(playerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['exchanges', 'room'],
      });
      expect(exchangeRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if room not found', async () => {
      // Restore original implementation for this test
      jest.spyOn(service, 'createExchange').mockRestore();

      jest.spyOn(roomRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createExchange(createExchangeDto)).rejects.toThrow(NotFoundException);

      expect(roomRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if player not found', async () => {
      // Restore original implementation for this test
      jest.spyOn(service, 'createExchange').mockRestore();

      jest.spyOn(playerRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createExchange(createExchangeDto)).rejects.toThrow(NotFoundException);

      expect(playerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['exchanges', 'room'],
      });
    });

    it('should throw BadRequestException if player does not belong to the room', async () => {
      // Restore original implementation for this test
      jest.spyOn(service, 'createExchange').mockRestore();

      const playerInDifferentRoom = {
        ...mockPlayer,
        room: { ...mockRoom, id: 2 },
      };

      jest.spyOn(playerRepository, 'findOne').mockResolvedValue(playerInDifferentRoom);

      await expect(service.createExchange(createExchangeDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if room is closed', async () => {
      // Restore original implementation for this test
      jest.spyOn(service, 'createExchange').mockRestore();

      const closedRoom = {
        ...mockRoom,
        status: RoomStatusEnum.Closed,
      };

      jest.spyOn(roomRepository, 'findOne').mockResolvedValue(closedRoom);

      await expect(service.createExchange(createExchangeDto)).rejects.toThrow(BadRequestException);
    });
  });
});
