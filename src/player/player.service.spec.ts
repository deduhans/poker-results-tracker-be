import { Test, TestingModule } from '@nestjs/testing';
import { PlayerService } from '@app/player/player.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Player } from '@entities/player.entity';
import { Room } from '@entities/room.entity';
import { User } from '@entities/user.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CreatePlayerDto } from '@app/player/types/CreatePlayerDto';

describe('PlayerService', () => {
    let service: PlayerService;
    let playerRepository: Repository<Player>;
    let roomRepository: Repository<Room>;
    let userRepository: Repository<User>;

    const mockDate = new Date();

    // Create mock objects
    const mockRoom = {
        id: 1,
        name: 'Test Room',
        exchange: 100,
        players: [],
        createdAt: mockDate,
        updatedAt: mockDate
    };

    const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        players: [],
        createdAt: mockDate,
        updatedAt: mockDate
    };

    const mockPlayer = {
        id: 1,
        name: 'testuser',
        roomId: 1,
        userId: 1,
        createdAt: mockDate,
        updatedAt: mockDate
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PlayerService,
                {
                    provide: getRepositoryToken(Player),
                    useValue: {
                        create: jest.fn().mockReturnValue(mockPlayer),
                        save: jest.fn().mockResolvedValue(mockPlayer),
                        findOneBy: jest.fn().mockResolvedValue(mockPlayer),
                    },
                },
                {
                    provide: getRepositoryToken(Room),
                    useValue: {
                        findOne: jest.fn().mockResolvedValue(mockRoom),
                        save: jest.fn().mockResolvedValue(mockRoom),
                    },
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOne: jest.fn().mockResolvedValue(mockUser),
                        save: jest.fn().mockResolvedValue(mockUser),
                    },
                },
            ],
        }).compile();

        service = module.get<PlayerService>(PlayerService);
        playerRepository = module.get<Repository<Player>>(getRepositoryToken(Player));
        roomRepository = module.get<Repository<Room>>(getRepositoryToken(Room));
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getPlayerById', () => {
        it('should return a player if found', async () => {
            const result = await service.getPlayerById(1);
            expect(result).toEqual(mockPlayer);
            expect(playerRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        });

        it('should throw NotFoundException if player not found', async () => {
            jest.spyOn(playerRepository, 'findOneBy').mockResolvedValueOnce(null);
            await expect(service.getPlayerById(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('createPlayer', () => {
        const createPlayerDto: CreatePlayerDto = {
            roomId: 1,
            userId: 1,
            name: 'Test Player',
        };

        it('should create a player successfully', async () => {
            const result = await service.createPlayer(createPlayerDto);
            expect(result).toEqual(mockPlayer);
            expect(playerRepository.create).toHaveBeenCalledWith(createPlayerDto);
            expect(playerRepository.save).toHaveBeenCalled();
            expect(roomRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                players: expect.arrayContaining([mockPlayer])
            }));
        });

        it('should throw NotFoundException if room not found', async () => {
            jest.spyOn(roomRepository, 'findOne').mockResolvedValueOnce(null);
            await expect(service.createPlayer(createPlayerDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if user not found', async () => {
            jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);
            await expect(service.createPlayer(createPlayerDto)).rejects.toThrow(NotFoundException);
        });

        it('should create player without user if userId is not provided', async () => {
            const createPlayerDtoWithoutUser = {
                roomId: 1,
                name: 'Test Player',
            };
            const result = await service.createPlayer(createPlayerDtoWithoutUser);
            expect(result).toEqual(mockPlayer);
            expect(userRepository.findOne).not.toHaveBeenCalled();
        });
    });
});