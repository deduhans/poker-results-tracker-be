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
  @ApiQuery({ name: 'key', required: false, description: 'Room key for password-protected rooms' })
  @ApiResponse({ status: 200, type: RoomDto })
  async findRoomById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Query('token') accessToken?: string,
    @Query('key') roomKey?: string
  ): Promise<RoomDto> {
    const userId = req.user?.userId;
    
    // Validate room key if provided, passing the user ID to check if they're a player
    if (roomKey) {
      const isValidKey = await this.roomService.validateRoomKey(id, roomKey, userId);
      if (!isValidKey) {
        throw new ForbiddenException('Invalid room key');
      }
    }

    // Pass the userId to the findById method
    const room: Room = await this.roomService.findById(id, accessToken, userId);
    
    // If room has a key and no key was provided, but the user is a player, proceed
    if (room.roomKey && !roomKey) {
      const isUserPlayer = await this.roomService.isUserPlayerInRoom(id, userId);
      
      // If the user is not a player, indicate the room requires a key
      if (!isUserPlayer) {
        return {
          id: room.id,
          requiresKey: true
        } as any;
      }
    }
    
    return plainToInstance(RoomDto, room);
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
    return plainToInstance(RoomDto, room);
  }

  @Put('close/:id')
  @ApiQuery({ name: 'token', required: false, description: 'Access token for invisible rooms' })
  @ApiQuery({ name: 'key', required: false, description: 'Room key for password-protected rooms' })
  @ApiBody({ type: [PlayerResultDto] })
  @ApiResponse({ status: 204, type: RoomDto })
  async closeRoom(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() playersResults: PlayerResultDto[],
    @Query('token') accessToken?: string,
    @Query('key') roomKey?: string
  ): Promise<RoomDto> {
    const userId = req.user.userId;
    
    // Validate room key if provided, passing the user ID to check if they're a player
    if (roomKey) {
      const isValidKey = await this.roomService.validateRoomKey(id, roomKey, userId);
      if (!isValidKey) {
        throw new ForbiddenException('Invalid room key');
      }
    }
    
    const room: Room = await this.roomService.close(id, playersResults, userId);
    return plainToInstance(RoomDto, room);
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
