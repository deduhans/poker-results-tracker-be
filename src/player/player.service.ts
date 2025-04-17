import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player, Room, User } from '@entities/index';
import { CreatePlayerDto } from '@app/player/types/CreatePlayerDto';
import { PlayerRoleEnum } from '@app/player/types/PlayerRoleEnum';
import { ChangePlayerRole } from '@app/player/types/ChangePlayerRole';
import { Logger } from '@nestjs/common';

@Injectable()
export class PlayerService {
  private readonly logger = new Logger(PlayerService.name);

  constructor(
    @InjectRepository(Player) private readonly playerRepository: Repository<Player>,
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) { }

  async getPlayerById(id: number): Promise<Player> {
    const player: Player | null = await this.playerRepository.findOneBy({ id: id });

    if (!player) {
      throw new NotFoundException('Could not find player by id: ' + id);
    }

    return player;
  }

  async createPlayer(player: CreatePlayerDto): Promise<Player> {
    const room = await this.roomRepository.findOne({
      where: { id: player.roomId },
      relations: ['players'],
    });

    if (!room) {
      throw new NotFoundException('Could not find room by id: ' + player.roomId);
    }

    const instance: Player = await this.playerRepository.create(player);
    const newPlayer: Player = await this.playerRepository.save(instance);

    room.players.push(newPlayer);
    await this.roomRepository.save(room);

    if (player.userId) {
      await this.assignToUser(newPlayer, player.userId);
    }

    return newPlayer;
  }

  async changeRole(changePlayerRole: ChangePlayerRole): Promise<void> {
    const player: Player = await this.getPlayerById(changePlayerRole.playerId);

    if (player.role === PlayerRoleEnum.Host) {
      throw new InternalServerErrorException('Colud not change host role.');
    } else if (player.role === changePlayerRole.role) {
      return;
    }

    await this.playerRepository.update(
      { id: changePlayerRole.playerId },
      { role: changePlayerRole.role },
    );
  }

  async assignPlayerToUser(playerId: number, userId: number): Promise<Player> {
    this.logger.log(`Assigning player ${playerId} to user ${userId}`);

    const player = await this.playerRepository.findOne({
      where: { id: playerId },
      relations: ['room'],
    });

    if (!player) {
      throw new NotFoundException(`Could not find player with id: ${playerId}`);
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['players', 'players.room'],
    });

    if (!user) {
      throw new NotFoundException(`Could not find user with id: ${userId}`);
    }

    const isUserInRoom = user.players.some(p => p.room && p.room.id === player.room.id);
    if (isUserInRoom) {
      throw new BadRequestException(`User is already assigned to another player in room ${player.room.id}`);
    }

    player.user = user;
    await this.playerRepository.save(player);

    this.logger.log(`Successfully assigned player ${playerId} to user ${userId}`);
    return player;
  }

  async setPlayerAsAdmin(playerId: number, currentUserId: number): Promise<Player> {
    this.logger.log(`Setting player ${playerId} as admin by user ${currentUserId}`);

    const player = await this.playerRepository.findOne({
      where: { id: playerId },
      relations: ['room', 'room.players', 'room.players.user', 'user'],
    });

    if (!player) {
      throw new NotFoundException(`Could not find player with id: ${playerId}`);
    }

    if (!player.user) {
      throw new BadRequestException('Cannot set as admin: player is not assigned to a user');
    }

    const hostPlayer = player.room.players.find(p => p.role === PlayerRoleEnum.Host);
    if (!hostPlayer || !hostPlayer.user) {
      throw new InternalServerErrorException('Room has no host player');
    }

    const isRequestFromHost = hostPlayer.user.id === currentUserId;
    if (!isRequestFromHost) {
      throw new BadRequestException('Only the host can set a player as admin');
    }

    player.role = PlayerRoleEnum.Admin;
    const updatedPlayer = await this.playerRepository.save(player);

    this.logger.log(`Successfully set player ${playerId} as admin`);
    return updatedPlayer;
  }

  private async assignToUser(player: Player, userId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['players'],
    });

    if (!user) {
      throw new NotFoundException('Could not find user by id: ' + userId);
    }

    user.players.push(player);
    await this.userRepository.save(user);
  }
}
