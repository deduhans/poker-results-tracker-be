import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from 'src/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { PlayerService } from 'src/player/player.service';
import { UserService } from 'src/user/user.service';
import { RoomDto } from './types/RoomDto';
import { CreateRoomDto } from './types/CreateRoomDto';
import { UserDto } from 'src/user/types/UserDto';
import { RoomStatus } from './types/RoomStatusEnum';
import { CreatePlayerDto } from 'src/player/types/CreatePlayerDto';
import { PlayerDto } from 'src/player/types/PlayerDto';

@Injectable()
export class RoomService {
    constructor(
        @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
        @Inject(PlayerService) private readonly playerService: PlayerService,
        @Inject(UserService) private readonly userService: UserService,
    ) { }

    async getAll(): Promise<RoomDto[]> {
        const rooms: Room[] = await this.roomRepository.find();

        return plainToInstance(RoomDto, rooms);
    }

    async create(createRoomDto: CreateRoomDto): Promise<RoomDto> {
        const instance: Room = await this.roomRepository.create(createRoomDto);
        instance.status = RoomStatus.Opened;
        const roomId: number = (await this.roomRepository.save(instance)).id;

        const host: UserDto = await this.userService.getUser(createRoomDto.name);
        const playerInstance: CreatePlayerDto = {
            roomId: roomId, 
            userId: createRoomDto.hostId, 
            name: host.username
        };
        await this.playerService.createPlayer(playerInstance);

        const createdRoom = await this.roomRepository.findOneBy({id: roomId});
        return plainToInstance(RoomDto, createdRoom);
    }

    async findById(id: number): Promise<RoomDto> {
        const room = await this.roomRepository.findOneBy({ id: id });

        const players: PlayerDto[] = await this.playerService.getPlayersByRoom(id);

        let result = plainToInstance(RoomDto, room);
        result.players = players;

        return result;
    }

    async close(id: number): Promise<RoomDto> {
        const room = await this.roomRepository.findOneBy({ id: id });

        if(room?.status === RoomStatus.Closed) {
            throw new BadRequestException('The room ia already closed');
        }

        await this.roomRepository.update({id: id}, {status: RoomStatus.Closed});
        const result = await this.roomRepository.findOneBy({ id: id });
        
        return plainToInstance(RoomDto, result);
    }
}
