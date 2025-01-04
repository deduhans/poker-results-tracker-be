import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { RoomDto } from './types/RoomDto';
import { CreateRoomDto } from './types/CreateRoomDto';
import { Room } from 'src/typeorm';
import { plainToInstance } from 'class-transformer';
import { AuthenticatedGuard } from 'src/auth/authenticated.guard';

@UseGuards(AuthenticatedGuard)
@Controller('rooms')
export class RoomController {
    constructor(private readonly roomService: RoomService) { }

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
    @ApiResponse({ status: 204, type: RoomDto })
    async closeRoom(@Param('id', ParseIntPipe) id: number): Promise<RoomDto> {
        const room: Room = await this.roomService.close(id);
        return plainToInstance(RoomDto, room);
    }
}