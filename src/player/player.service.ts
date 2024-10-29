import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Player } from 'src/typeorm/player.entity';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Payment } from 'src/typeorm';
import { PlayerDto } from './types/PlayerDto';
import { CreatePlayerDto } from './types/CreatePlayerDto';
import { PlayerRole } from './types/PlayerRoleEnum';

@Injectable()
export class PlayerService {
    constructor(
        @InjectRepository(Player) private readonly playerRepository: Repository<Player>,
        @InjectRepository(Payment) private readonly paymentRepository: Repository<Payment>,
    ) { }

    async getPlayer(id: number): Promise<PlayerDto> {
        const player = await this.playerRepository.findOneBy({ id: id });
        return plainToInstance(PlayerDto, player);
    }

    async getPlayersByRoom(roomId: number): Promise<PlayerDto[]> {
        const players: Player[] = await this.playerRepository.findBy({ roomId: roomId });

        const result: PlayerDto[] = plainToInstance(PlayerDto, players);

        for (const key in result) {
            if (Object.prototype.hasOwnProperty.call(result, key)) {
                const element = result[key];
                element.payments = await this.paymentRepository.findBy({playerId: element.id});
            }
        }

        return result;
    }

    async createPlayer(player: CreatePlayerDto): Promise<PlayerDto> {
        const playersInRoom: Player[] = await this.playerRepository.findBy({roomId: player.roomId});
        const instance: Player = await this.playerRepository.create(player);

        if(playersInRoom.length === 0) {
            instance.role = PlayerRole.Host;
        } else {
            instance.role = PlayerRole.Player;
        }

        const newPlayer: Player = await this.playerRepository.save(instance);

        return plainToInstance(PlayerDto, newPlayer);
    }
}
