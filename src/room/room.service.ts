import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '@entities/room.entity';
import { CreateRoomDto } from '@app/room/types/CreateRoomDto';
import { PlayerService } from '@app/player/player.service';
import { UserService } from '@app/user/user.service';
import { plainToInstance } from 'class-transformer';
import { RoomDto } from '@app/room/types/RoomDto';
import { User } from '@entities/user.entity';
import { CreatePlayerDto } from '@app/player/types/CreatePlayerDto';
import { PlayerRoleEnum } from '@app/player/types/PlayerRoleEnum';
import { RoomStatusEnum } from '@app/room/types/RoomStatusEnum';
import { PlayerResultDto } from '@app/player/types/PlayerResult';
import { Player } from '@entities/player.entity';
import { ExchangeService } from '@app/exchange/exchange.service';
import { CreateExchangeDto } from '@app/exchange/types/CreateExchangeDto';
import { ExchangeDirectionEnum } from '@app/exchange/types/ExchangeDirectionEnum';
import * as currencyJs from 'currency.js';
import { CurrencyEnum } from './types/CurrencyEnum';
import * as crypto from 'crypto';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  constructor(
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    @Inject(PlayerService) private readonly playerService: PlayerService,
    @Inject(UserService) private readonly userService: UserService,
    @Inject(ExchangeService) private readonly exchangeService: ExchangeService,
  ) { }

  /**
   * Retrieves all visible rooms and rooms where the user is a player
   * @param userId Optional current user ID to include their invisible rooms
   * @returns A list of visible rooms and rooms where the user is a player
   */
  async getAll(userId?: number): Promise<RoomDto[]> {
    // Start with a query builder for all rooms
    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.players', 'player')
      .leftJoinAndSelect('player.user', 'user');

    // If user ID is provided, only get rooms where the user is a player
    if (userId) {
      queryBuilder.where('player.user.id = :userId', {
        userId,
      });
    } else {
      // Otherwise, just get visible rooms (for non-authenticated users)
      queryBuilder.where('room.isVisible = :isVisible', { isVisible: true });
    }

    const rooms = await queryBuilder.getMany();
    return plainToInstance(RoomDto, rooms);
  }

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    this.logger.log(`Creating new room with name: ${createRoomDto.name}`);

    try {
      const host: User = await this.userService.getUserById(createRoomDto.hostId);

      // Generate access token for all rooms
      const accessToken = this.generateAccessToken();

      // Prepare room data with new fields
      const roomData = {
        name: createRoomDto.name,
        exchange: createRoomDto.exchange,
        currency: createRoomDto.currency || CurrencyEnum.USD, // Default to USD if not provided
        baseBuyIn: createRoomDto.baseBuyIn || 50, // Default to 50 if not provided
        isVisible: createRoomDto.isVisible === undefined ? true : createRoomDto.isVisible, // Default to true if not provided
        accessToken: accessToken, // Add access token for all rooms
      };

      // Create the room entity with the correct typing
      const instance: Room = this.roomRepository.create(roomData as Partial<Room>);
      const roomId: number = (await this.roomRepository.save(instance)).id;

      const playerInstance: CreatePlayerDto = {
        roomId: roomId,
        userId: host.id,
        name: host.username,
      };
      const player = await this.playerService.createPlayer(playerInstance);
      await this.playerService.changeRole({ playerId: player.id, role: PlayerRoleEnum.Host });

      const createdRoom = await this.findById(roomId, accessToken);
      this.logger.log(`Successfully created room with ID: ${roomId}`);

      return createdRoom;
    } catch (error) {
      this.logger.error(`Failed to create room: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw new BadRequestException(`Host with ID ${createRoomDto.hostId} not found`);
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create room');
    }
  }

  /**
   * Find a room by its ID
   * @param id The room ID
   * @param accessToken Optional access token for invisible rooms
   * @param userId Optional user ID to check if user is a player in the room
   * @returns The found room
   */
  async findById(id: number, accessToken?: string, userId?: number): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['players', 'players.user', 'players.exchanges'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check if user is a player in the room
    const isUserPlayer = userId && room.players.some(player =>
      player.user && player.user.id === userId
    );

    // If user is not a player, they must have a valid access token to access the room
    if (!isUserPlayer) {
      if (!accessToken || room.accessToken !== accessToken) {
        throw new ForbiddenException('Access to this room is restricted. You need an access token or to be a player in this room.');
      }
    }

    return room;
  }

  async regenerateAccessToken(id: number, userId: number): Promise<string> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['players', 'players.user'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check if the user is the host of the room
    const isHost = room.players.some(
      (player) => player.user?.id === userId && player.role === PlayerRoleEnum.Host,
    );

    if (!isHost) {
      throw new ForbiddenException('Only the host can regenerate the access token');
    }

    // Generate a new access token
    const newAccessToken = this.generateAccessToken();
    room.accessToken = newAccessToken;

    // Save the room with the new access token
    await this.roomRepository.save(room);

    return newAccessToken;
  }

  async close(id: number, playersResults: PlayerResultDto[], userId: number): Promise<Room> {
    this.logger.log(`Attempting to close room with ID: ${id} by user ID: ${userId}`);
    const room = await this.findById(id, undefined, userId);

    // Check if the user attempting to close the room is the host or an admin
    const canCloseRoom = this.canUserManageRoom(room, userId);
    if (!canCloseRoom) {
      this.logger.warn(`User ${userId} attempted to close room ${id} but does not have permission`);
      throw new ForbiddenException('Only the host or an admin can close the room');
    }

    if (room.status === RoomStatusEnum.Closed) {
      this.logger.warn(`Attempted to close already closed room: ${id}`);
      throw new BadRequestException('The room is already closed');
    }

    if (!playersResults || playersResults.length === 0) {
      throw new BadRequestException('Players results are required to close the room');
    }

    const totalBalance = await this.calculateTotalBalance(playersResults);
    const totalBuyIn = await this.calculateTotalBuyIn(room.players);

    this.logger.log(`Total balance: ${totalBalance}`);
    this.logger.log(`Total buy-in: ${totalBuyIn}`);

    // Compare with small tolerance for floating point comparison
    const difference = currencyJs(totalBalance).divide(room.exchange).subtract(totalBuyIn).value;
    if (Math.abs(difference) > 0.01) {
      throw new BadRequestException(
        'Cannot close room: total income and outcome must be equal to 0',
      );
    }

    await this.processExchange(id, playersResults);
    await this.roomRepository.update({ id: id }, { status: RoomStatusEnum.Closed });

    this.logger.log(`Successfully closed room with ID: ${id}`);
    return await this.findById(id, room.accessToken);
  }

  async isUserPlayerInRoom(roomId: number, userId: number): Promise<boolean> {
    if (!userId) return false;

    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['players', 'players.user'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room.players.some(player => player.user && player.user.id === userId);
  }

  async isUserExistsInRoom(roomId: number, userId: number): Promise<boolean> {
    this.logger.log(`Checking if user ${userId} exists in room ${roomId}`);
    const room = await this.findById(roomId);
    return room.players.some((player) => player.user && player.user.id === userId);
  }

  private canUserManageRoom(room: Room, userId: number): boolean {
    const isHost = this.isUserTheHost(room, userId);
    const isAdmin = room.players.some(
      (player) => player.user && player.user.id === userId && player.role === PlayerRoleEnum.Admin,
    );
    return isHost || isAdmin;
  }

  private isUserTheHost(room: Room, userId: number): boolean {
    const hostPlayer = room.players.find(player => player.role === PlayerRoleEnum.Host);
    return !!hostPlayer && !!hostPlayer.user && hostPlayer.user.id === userId;
  }

  // Generate a random access token
  private generateAccessToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async calculateTotalBalance(playersResults: PlayerResultDto[]): Promise<string> {
    let totalBalance = currencyJs(0);

    playersResults.forEach(player => {
      totalBalance = totalBalance.add(player.income);
    });

    return totalBalance.toString();
  }

  private async calculateTotalBuyIn(players: Player[]): Promise<string> {
    let totalBuyIn = currencyJs(0);

    players?.forEach(player => {
      player.exchanges?.forEach(exchange => {
        if (exchange.direction === ExchangeDirectionEnum.BuyIn) {
          totalBuyIn = totalBuyIn.add(exchange.cashAmount);
        } else if (exchange.direction === ExchangeDirectionEnum.CashOut) {
          totalBuyIn = totalBuyIn.subtract(exchange.cashAmount);
        }
      });
    });

    return totalBuyIn.toString();
  }

  private async processExchange(id: number, playersResults: PlayerResultDto[]): Promise<void> {
    this.logger.log(`Processing exchanges for room ${id}`);
    try {
      await Promise.all(
        playersResults.filter((player) => currencyJs(player.income).value !== 0).map(async (player) => {
          const exchange: CreateExchangeDto = {
            roomId: id,
            playerId: player.id,
            amount: Math.abs(currencyJs(player.income).value),
            type: ExchangeDirectionEnum.CashOut,
          };
          return this.exchangeService.createExchange(exchange);
        }),
      );
    } catch (error) {
      this.logger.error(`Error processing exchanges: ${error.message}`);
      throw new BadRequestException('Error processing exchanges');
    }
  }
}
