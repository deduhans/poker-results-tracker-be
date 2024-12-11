import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Player } from 'src/typeorm/player.entity';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Payment } from 'src/typeorm';
import { PlayerDto } from './types/PlayerDto';
import { CreatePlayerDto } from './types/CreatePlayerDto';
import { PlayerRoleEnum } from './types/PlayerRoleEnum';
import { ChangePlayerRole } from './types/ChangePlayerRole';

@Injectable()
export class PlayerService {
    constructor(
        @InjectRepository(Player) private readonly playerRepository: Repository<Player>,
        @InjectRepository(Payment) private readonly paymentRepository: Repository<Payment>,
    ) { }

    async getPlayerById(id: number): Promise<Player> {
        const player: Player | null = await this.playerRepository.findOneBy({ id: id });

        if (!player) {
            throw new NotFoundException('Could not find player by id: ' + id);
        }

        return player;
    }

    async createPlayer(player: CreatePlayerDto): Promise<Player> {
        const instance: Player = await this.playerRepository.create(player);
        const newPlayer: Player = await this.playerRepository.save(instance);

        return newPlayer;
    }

    async changeRole(changePlayerRole: ChangePlayerRole): Promise<void> {
        let player: Player = await this.getPlayerById(changePlayerRole.playerId);

        if (player.role === PlayerRoleEnum.Host) {
            throw new InternalServerErrorException('Colud not change host role.')
        } else if (player.role === changePlayerRole.role) {
            return;
        }

        await this.playerRepository.update({ id: changePlayerRole.playerId }, { role: changePlayerRole.role });
    }
}
