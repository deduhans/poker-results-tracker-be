import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, UseGuards, Request, ForbiddenException, Query } from '@nestjs/common';
import { RoomService } from '@app/room/room.service';
import { ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { RoomDto } from '@app/room/types/RoomDto';
import { CreateRoomDto } from '@app/room/types/CreateRoomDto';
import { Room } from '@entities/room.entity';
import { plainToInstance } from 'class-transformer';
import { AuthenticatedGuard } from '@app/auth/authenticated.guard';
import { PlayerResultDto } from '@app/player/types/PlayerResult';

@UseGuards(AuthenticatedGuard)
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) { }

  @Get()
  @ApiResponse({ status: 200, type: [RoomDto] })
  async getRoom(@Request() req): Promise<RoomDto[]> {
    // Pass the user ID to get their invisible rooms where they're a player
    const userId = req.user?.userId;
    return await this.roomService.getAll(userId);
  }

  @Get(':id')
  @ApiQuery({ name: 'token', required: false, description: 'Access token for invisible rooms' })
  @ApiResponse({ status: 200, type: RoomDto })
  async findRoomById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Query('token') accessToken?: string,
  ): Promise<RoomDto> {
    const userId = req.user?.userId;
    const room: Room = await this.roomService.findById(id, accessToken, userId);

    // Transform the entity to DTO with all nested relations
    return plainToInstance(RoomDto, room, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true
    });
  }

  @Post()
  @ApiBody({ type: CreateRoomDto })
  @ApiResponse({ status: 201, type: RoomDto })
  async createRoom(
    @Body() createRoomDto: CreateRoomDto,
    @Request() req
  ): Promise<RoomDto> {
    // We don't need to pass userId to the create method - just use the DTO
    const room: Room = await this.roomService.create(createRoomDto);
    return plainToInstance(RoomDto, room, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true
    });
  }

  @Put('close/:id')
  @ApiQuery({ name: 'token', required: false, description: 'Access token for invisible rooms' })
  @ApiBody({ type: [PlayerResultDto] })
  @ApiResponse({ status: 204, type: RoomDto })
  async closeRoom(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() playersResults: PlayerResultDto[],
    @Query('token') accessToken?: string,
  ): Promise<RoomDto> {
    const userId = req.user.userId;
    const room: Room = await this.roomService.close(id, playersResults, userId);
    return plainToInstance(RoomDto, room, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true
    });
  }

  @Put(':id/regenerate-token')
  @ApiResponse({ status: 200, description: 'New access token for the room' })
  async regenerateAccessToken(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ): Promise<{ accessToken: string }> {
    const userId = req.user.userId;
    const newToken = await this.roomService.regenerateAccessToken(id, userId);
    return { accessToken: newToken };
  }
}
