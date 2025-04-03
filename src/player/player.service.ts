import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player, Room, User } from '@entities/index';
import { CreatePlayerDto } from '@app/player/types/CreatePlayerDto';
import { PlayerRoleEnum } from '@app/player/types/PlayerRoleEnum';
import { ChangePlayerRole } from '@app/player/types/ChangePlayerRole';

@Injectable()
export class PlayerService {
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
