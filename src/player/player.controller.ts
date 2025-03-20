import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PlayerService } from '@app/player/player.service';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { PlayerDto } from '@app/player/types/PlayerDto';
import { CreatePlayerDto } from '@app/player/types/CreatePlayerDto';
import { Player } from '@entities/player.entity';
import { plainToInstance } from 'class-transformer';
import { AuthenticatedGuard } from '@app/auth/authenticated.guard';

@UseGuards(AuthenticatedGuard)
@Controller('players')
export class PlayerController {
    constructor(private readonly playerService: PlayerService) { }

    @Post()
    @ApiBody({ type: CreatePlayerDto })
    @ApiResponse({ type: PlayerDto })
    async createPlayer(@Body() player: CreatePlayerDto): Promise<PlayerDto> {
        const newPlayer: Player = await this.playerService.createPlayer(player);

        return plainToInstance(PlayerDto, newPlayer);
    }
}
