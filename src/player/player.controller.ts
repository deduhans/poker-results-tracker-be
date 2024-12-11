import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { PlayerService } from './player.service';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { PlayerDto } from './types/PlayerDto';
import { CreatePlayerDto } from './types/CreatePlayerDto';
import { Player } from 'src/typeorm/player.entity';
import { plainToInstance } from 'class-transformer';

@Controller('player')
export class PlayerController {
    constructor(private readonly playerService: PlayerService) { }

    @Post('create')
    @ApiBody({ type: CreatePlayerDto })
    @ApiResponse({ type: PlayerDto })
    async createPlayer(@Body() player: CreatePlayerDto): Promise<PlayerDto> {
        const newPlayer: Player = await this.playerService.createPlayer(player);
        return plainToInstance(PlayerDto, newPlayer);
    }
}
