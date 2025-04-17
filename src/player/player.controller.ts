import { Body, Controller, Param, Patch, Post, Request, UseGuards, ParseIntPipe } from '@nestjs/common';
import { PlayerService } from '@app/player/player.service';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PlayerDto } from '@app/player/types/PlayerDto';
import { CreatePlayerDto } from '@app/player/types/CreatePlayerDto';
import { Player } from '@entities/player.entity';
import { plainToInstance } from 'class-transformer';
import { AuthenticatedGuard } from '@app/auth/authenticated.guard';

@ApiTags('players')
@UseGuards(AuthenticatedGuard)
@Controller('players')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new player in a room' })
  @ApiResponse({
    status: 201,
    description: 'Player successfully created',
    type: PlayerDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input (e.g. user already in room, room is full, room is closed)',
  })
  @ApiNotFoundResponse({
    description: 'Room or user not found',
  })
  @ApiForbiddenResponse({
    description: 'User is not authenticated',
  })
  async createPlayer(@Body() player: CreatePlayerDto): Promise<PlayerDto> {
    const newPlayer: Player = await this.playerService.createPlayer(player);
    return plainToInstance(PlayerDto, newPlayer, { excludeExtraneousValues: true });
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign a player to the current user' })
  @ApiParam({ name: 'id', description: 'Player ID to assign' })
  @ApiResponse({
    status: 200,
    description: 'Player successfully assigned to user',
    type: PlayerDto,
  })
  @ApiBadRequestResponse({
    description: 'User is already assigned to another player in the same room',
  })
  @ApiNotFoundResponse({
    description: 'Player or user not found',
  })
  @ApiForbiddenResponse({
    description: 'User is not authenticated',
  })
  async assignPlayerToUser(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<PlayerDto> {
    const userId = req.user.userId;
    const player: Player = await this.playerService.assignPlayerToUser(id, userId);
    return plainToInstance(PlayerDto, player, { excludeExtraneousValues: true });
  }

  @Patch(':id/setAdmin')
  @ApiOperation({ summary: 'Set a player as an admin (can only be done by the host)' })
  @ApiParam({ name: 'id', description: 'Player ID to promote to admin' })
  @ApiResponse({
    status: 200,
    description: 'Player successfully set as admin',
    type: PlayerDto,
  })
  @ApiBadRequestResponse({
    description: 'Player is not assigned to a user or requester is not the host',
  })
  @ApiNotFoundResponse({
    description: 'Player not found',
  })
  @ApiForbiddenResponse({
    description: 'User is not authenticated',
  })
  async setPlayerAsAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<PlayerDto> {
    const userId = req.user.userId;
    const player: Player = await this.playerService.setPlayerAsAdmin(id, userId);
    return plainToInstance(PlayerDto, player, { excludeExtraneousValues: true });
  }
}
