import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '@app/user/user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '@entities/user.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  const mockUser = {
    id: 1,
    username: 'testuser',
    password: 'hashedPassword123',
    createdAt: new Date(),
    players: []
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUser', () => {
    it('should return a user if found', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.getUser('testuser');

      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.id);
      expect(result.username).toBe(mockUser.username);
      expect(result).not.toHaveProperty('password');
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        username: 'testuser'
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.getUser('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should convert username to lowercase when searching', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);

      await service.getUser('TestUser');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        username: 'testuser'
      });
    });
  });

  describe('createUser', () => {
    const createUserDto = {
      username: 'newuser',
      password: 'Password123'
    };

    it('should create a new user successfully', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.createUser(createUserDto);

      expect(result).toBeDefined();
      expect(result.username).toBe(mockUser.username);
      expect(result).not.toHaveProperty('password');
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if username already exists', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);

      await expect(service.createUser(createUserDto))
        .rejects.toThrow(ConflictException);

      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should hash the password before saving', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      mockRepository.create.mockImplementation(dto => dto);
      mockRepository.save.mockImplementation(user => ({
        ...user,
        id: 1,
        createdAt: new Date()
      }));

      await service.createUser(createUserDto);

      const savedUser = mockRepository.create.mock.calls[0][0];
      expect(savedUser.password).not.toBe(createUserDto.password);
      expect(await bcrypt.compare(createUserDto.password, savedUser.password)).toBe(true);
    });

    it('should trim and lowercase username before saving', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      mockRepository.create.mockImplementation(dto => dto);
      mockRepository.save.mockImplementation(user => ({
        ...user,
        id: 1,
        createdAt: new Date()
      }));

      await service.createUser({
        username: '  TestUser  ',
        password: 'Password123'
      });

      const savedUser = mockRepository.create.mock.calls[0][0];
      expect(savedUser.username).toBe('testuser');
    });
  });
});