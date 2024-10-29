import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { PlayerService } from './player.service';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { PlayerDto } from './types/PlayerDto';
import { CreatePlayerDto } from './types/CreatePlayerDto';

@Controller('player')
export class PlayerController {
    constructor(private readonly playerService: PlayerService) { }

    @Get(':roomId')
    async getPlayers(@Param('roomId', ParseIntPipe) roomId: number): Promise<PlayerDto[]> {
        return await this.playerService.getPlayersByRoom(roomId);
    }

    @Post('create')
    @ApiBody({ type: CreatePlayerDto })
    @ApiResponse({type: PlayerDto})
    async createPlayer(@Body() player: CreatePlayerDto): Promise<PlayerDto> {
        return await this.playerService.createPlayer(player);
    }
}
