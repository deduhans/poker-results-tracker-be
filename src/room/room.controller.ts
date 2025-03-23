import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { RoomService } from '@app/room/room.service';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { RoomDto } from '@app/room/types/RoomDto';
import { CreateRoomDto } from '@app/room/types/CreateRoomDto';
import { Room } from '@entities/room.entity';
import { plainToInstance } from 'class-transformer';
import { AuthenticatedGuard } from '@app/auth/authenticated.guard';
import { PlayerResultDto } from '@app/player/types/PlayerResult';

@UseGuards(AuthenticatedGuard)
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  @ApiResponse({ status: 200, type: [RoomDto] })
  async getRoom(): Promise<RoomDto[]> {
    return await this.roomService.getAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: RoomDto })
  async findRoomById(@Param('id', ParseIntPipe) id: number): Promise<RoomDto> {
    const room: Room = await this.roomService.findById(id);
    return plainToInstance(RoomDto, room);
  }

  @Post()
  @ApiBody({ type: CreateRoomDto })
  @ApiResponse({ status: 201, type: RoomDto })
  async createRoom(@Body() createRoomDto: CreateRoomDto): Promise<RoomDto> {
    const room: Room = await this.roomService.create(createRoomDto);
    return plainToInstance(RoomDto, room);
  }

  @Put('close/:id')
  @ApiBody({ type: [PlayerResultDto] })
  @ApiResponse({ status: 204, type: RoomDto })
  async closeRoom(
    @Param('id', ParseIntPipe) id: number,
    @Body() playersResults: PlayerResultDto[],
  ): Promise<RoomDto> {
    const room: Room = await this.roomService.close(id, playersResults);
    return plainToInstance(RoomDto, room);
  }
}
