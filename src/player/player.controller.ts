import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PlayerService } from '@app/player/player.service';
import { ApiBadRequestResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PlayerDto } from '@app/player/types/PlayerDto';
import { CreatePlayerDto } from '@app/player/types/CreatePlayerDto';
import { Player } from '@entities/player.entity';
import { plainToInstance } from 'class-transformer';
import { AuthenticatedGuard } from '@app/auth/authenticated.guard';

@ApiTags('players')
@UseGuards(AuthenticatedGuard)
@Controller('players')
export class PlayerController {
    constructor(private readonly playerService: PlayerService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new player in a room' })
    @ApiResponse({ 
        status: 201, 
        description: 'Player successfully created',
        type: PlayerDto 
    })
    @ApiBadRequestResponse({ 
        description: 'Invalid input (e.g. user already in room, room is full, room is closed)' 
    })
    @ApiNotFoundResponse({ 
        description: 'Room or user not found' 
    })
    @ApiForbiddenResponse({ 
        description: 'User is not authenticated' 
    })
    async createPlayer(@Body() player: CreatePlayerDto): Promise<PlayerDto> {
        const newPlayer: Player = await this.playerService.createPlayer(player);
        return plainToInstance(PlayerDto, newPlayer, { excludeExtraneousValues: true });
    }
}
