import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { RoomDto } from './types/RoomDto';
import { CreateRoomDto } from './types/CreateRoomDto';
import { AuthenticatedGuard } from 'src/auth/authenticated.guard';

@UseGuards(AuthenticatedGuard)
@Controller('room')
export class RoomController {
    constructor(private readonly roomService: RoomService) { }

    @Get()
    @ApiResponse({ status: 200, type: RoomDto })
    async getRoom(): Promise<RoomDto[]> {
        return await this.roomService.getAll();
    }

    @Get(':id')
    @ApiResponse({ status: 200, type: RoomDto })
    async findRoomById(@Param('id', ParseIntPipe) id: number): Promise<RoomDto> {
        return await this.roomService.findById(id);
    }

    @Post('create')
    @ApiBody({ type: CreateRoomDto })
    @ApiResponse({ status: 201, type: RoomDto })
    async createRoom(@Body() createRoomDto: CreateRoomDto): Promise<RoomDto> {
        return await this.roomService.create(createRoomDto);
    }

    @Patch('close/:id')
    @ApiResponse({ status: 204, type: RoomDto })
    async closeRoom(@Param('id', ParseIntPipe) id: number): Promise<RoomDto> {
        return await this.roomService.close(id);
    }
}