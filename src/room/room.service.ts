import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room, User } from '@entities/index';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { PlayerService } from '@app/player/player.service';
import { UserService } from '@app/user/user.service';
import { ExchangeService } from '@app/exchange/exchange.service';
import { RoomDto } from '@app/room/types/RoomDto';
import { CreateRoomDto } from '@app/room/types/CreateRoomDto';
import { RoomStatusEnum } from '@app/room/types/RoomStatusEnum';
import { CreatePlayerDto } from '@app/player/types/CreatePlayerDto';
import { PlayerRoleEnum } from '@app/player/types/PlayerRoleEnum';
import { ExchangeDirectionEnum } from '@app/exchange/types/ExchangeDirectionEnum';
import { CreateExchangeDto } from '@app/exchange/types/CreateExchangeDto';
import { PlayerResultDto } from '@app/player/types/PlayerResult';
import { Player } from '@entities/player.entity';
import * as currencyJs from 'currency.js';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  constructor(
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    @Inject(PlayerService) private readonly playerService: PlayerService,
    @Inject(UserService) private readonly userService: UserService,
    @Inject(ExchangeService) private readonly exchangeService: ExchangeService,
  ) { }

  async getAll(): Promise<RoomDto[]> {
    this.logger.log('Fetching all rooms');
    const rooms: Room[] = await this.roomRepository.find();
    return plainToInstance(RoomDto, rooms);
  }

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    this.logger.log(`Creating new room with name: ${createRoomDto.name}`);

    try {
      const host: User = await this.userService.getUserById(createRoomDto.hostId);

      const instance: Room = await this.roomRepository.create(createRoomDto);
      const roomId: number = (await this.roomRepository.save(instance)).id;

      const playerInstance: CreatePlayerDto = {
        roomId: roomId,
        userId: host.id,
        name: host.username,
      };
      const player = await this.playerService.createPlayer(playerInstance);
      await this.playerService.changeRole({ playerId: player.id, role: PlayerRoleEnum.Host });

      const createdRoom = await this.findById(roomId);
      this.logger.log(`Successfully created room with ID: ${roomId}`);

      return createdRoom;
    } catch (error) {
      this.logger.error(`Failed to create room: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw new BadRequestException(`Host with ID ${createRoomDto.hostId} not found`);
      }
      throw new InternalServerErrorException('Failed to create room');
    }
  }

  async findById(id: number): Promise<Room> {
    this.logger.log(`Finding room by ID: ${id}`);
    const room = await this.roomRepository.findOne({
      where: { id: id },
      relations: ['players', 'players.exchanges'],
    });

    if (!room) {
      this.logger.warn(`Room with ID ${id} not found`);
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return room;
  }

  async close(id: number, playersResults: PlayerResultDto[]): Promise<Room> {
    this.logger.log(`Attempting to close room with ID: ${id}`);
    const room = await this.findById(id);

    if (room.status === RoomStatusEnum.Closed) {
      this.logger.warn(`Attempted to close already closed room: ${id}`);
      throw new BadRequestException('The room is already closed');
    }

    if (!playersResults || playersResults.length === 0) {
      throw new BadRequestException('Players results are required to close the room');
    }

    const totalBalance = await this.calculateTotalBalance(playersResults);
    const totalBuyIn = await this.calculateTotalBuyIn(room.players, room.exchange);
    
    // Compare with small tolerance for floating point comparison
    const difference = currencyJs(totalBalance).subtract(totalBuyIn).value;
    if (Math.abs(difference) > 0.01) {
      throw new BadRequestException(
        'Cannot close room: total income and outcome must be equal to 0',
      );
    }

    await this.processPayments(id, playersResults);
    await this.roomRepository.update({ id: id }, { status: RoomStatusEnum.Closed });

    this.logger.log(`Successfully closed room with ID: ${id}`);
    return await this.findById(id);
  }

  private async calculateTotalBalance(playersResults: PlayerResultDto[]): Promise<string> {
    let totalBalance = currencyJs(0);
    
    playersResults.forEach(player => {
      totalBalance = totalBalance.add(player.income);
    });

    return totalBalance.toString();
  }

  private async calculateTotalBuyIn(players: Player[], exchangeRate: number): Promise<string> {
    let totalBuyIn = currencyJs(0);
    
    players.forEach(player => {
      player.exchanges.forEach(exchange => {
        totalBuyIn = totalBuyIn.add(exchange.cashAmount);
      });
    });

    return totalBuyIn.toString();
  }

  private async processPayments(id: number, playersResults: PlayerResultDto[]): Promise<void> {
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
          await this.exchangeService.createExchange(exchange);
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to process exchanges: ${error.message}`);
      throw new InternalServerErrorException('Failed to process room exchanges');
    }
  }

  async isUserExistsInRoom(roomId: number, userId: number): Promise<boolean> {
    const room = await this.findById(roomId);
    return room.players.some((player) => player.user?.id === userId);
  }
}
