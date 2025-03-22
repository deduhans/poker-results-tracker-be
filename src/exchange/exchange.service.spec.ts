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
        updatedAt: mockDate
    };

    const mockExchange: any = {
        id: 1,
        player: null, // Will be set later
        direction: ExchangeDirectionEnum.BuyIn,
        chipAmount: 10,
        cashAmount: 1000, // 10 chips * 100 exchange rate
        createdAt: mockDate,
        updatedAt: mockDate
    };

    const mockPlayer: any = {
        id: 1,
        name: 'Test Player',
        role: PlayerRoleEnum.Player,
        room: mockRoom,
        exchanges: [mockExchange],
        createdAt: mockDate,
        updatedAt: mockDate
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
                        create: jest.fn().mockReturnValue(mockExchange),
                        save: jest.fn().mockResolvedValue(mockExchange),
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
            const result = await service.createExchange(createExchangeDto);
            
            expect(result).toEqual(mockExchange);
            expect(roomRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(playerRepository.findOne).toHaveBeenCalledWith({ 
                where: { id: 1 }, 
                relations: ['exchanges', 'room'] 
            });
            expect(exchangeRepository.create).toHaveBeenCalledWith({
                player: mockPlayer,
                direction: ExchangeDirectionEnum.BuyIn,
                chipAmount: 10,
                cashAmount: 1000
            });
            expect(exchangeRepository.save).toHaveBeenCalled();
        });

        it('should create a cash-out exchange successfully', async () => {
            const cashOutDto = {
                ...createExchangeDto,
                type: ExchangeDirectionEnum.CashOut
            };
            
            // Mock the calculatePlayerChipBalance method
            jest.spyOn(service as any, 'calculatePlayerChipBalance').mockResolvedValue(20);
            
            const result = await service.createExchange(cashOutDto);
            
            expect(result).toEqual(mockExchange);
            expect((service as any).calculatePlayerChipBalance).toHaveBeenCalledWith(1);
        });

        it('should throw NotFoundException if room not found', async () => {
            jest.spyOn(roomRepository, 'findOne').mockResolvedValue(null);
            
            await expect(service.createExchange(createExchangeDto))
                .rejects.toThrow(NotFoundException);
            
            expect(roomRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        });

        it('should throw NotFoundException if player not found', async () => {
            jest.spyOn(playerRepository, 'findOne').mockResolvedValue(null);
            
            await expect(service.createExchange(createExchangeDto))
                .rejects.toThrow(NotFoundException);
            
            expect(playerRepository.findOne).toHaveBeenCalledWith({ 
                where: { id: 1 }, 
                relations: ['exchanges', 'room'] 
            });
        });

        it('should throw BadRequestException if player does not belong to the room', async () => {
            const playerInDifferentRoom = {
                ...mockPlayer,
                room: { ...mockRoom, id: 2 }
            };
            
            jest.spyOn(playerRepository, 'findOne').mockResolvedValue(playerInDifferentRoom);
            
            await expect(service.createExchange(createExchangeDto))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if room is closed', async () => {
            const closedRoom = {
                ...mockRoom,
                status: RoomStatusEnum.Closed
            };
            
            jest.spyOn(roomRepository, 'findOne').mockResolvedValue(closedRoom);
            
            await expect(service.createExchange(createExchangeDto))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if trying to cash out more chips than available', async () => {
            const cashOutTooMuchDto = {
                ...createExchangeDto,
                type: ExchangeDirectionEnum.CashOut,
                amount: 50
            };
            
            // Mock the calculatePlayerChipBalance method to return less than requested
            jest.spyOn(service as any, 'calculatePlayerChipBalance').mockResolvedValue(20);
            
            await expect(service.createExchange(cashOutTooMuchDto))
                .rejects.toThrow(BadRequestException);
            
            expect((service as any).calculatePlayerChipBalance).toHaveBeenCalledWith(1);
        });
    });

    describe('calculatePlayerChipBalance', () => {
        it('should calculate the correct chip balance', async () => {
            const playerWithExchanges = {
                ...mockPlayer,
                exchanges: [
                    { direction: ExchangeDirectionEnum.BuyIn, chipAmount: 30 },
                    { direction: ExchangeDirectionEnum.CashOut, chipAmount: 10 },
                    { direction: ExchangeDirectionEnum.BuyIn, chipAmount: 5 }
                ]
            };
            
            jest.spyOn(playerRepository, 'findOne').mockResolvedValue(playerWithExchanges);
            
            const result = await (service as any).calculatePlayerChipBalance(1);
            
            // 30 (buy in) - 10 (cash out) + 5 (buy in) = 25
            expect(result).toBe(25);
            expect(playerRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: ['exchanges']
            });
        });

        it('should return 0 if player has no exchanges', async () => {
            const playerWithNoExchanges = {
                ...mockPlayer,
                exchanges: []
            };
            
            jest.spyOn(playerRepository, 'findOne').mockResolvedValue(playerWithNoExchanges);
            
            const result = await (service as any).calculatePlayerChipBalance(1);
            
            expect(result).toBe(0);
        });

        it('should return 0 if player not found', async () => {
            jest.spyOn(playerRepository, 'findOne').mockResolvedValue(null);
            
            const result = await (service as any).calculatePlayerChipBalance(999);
            
            expect(result).toBe(0);
        });
    });
});
