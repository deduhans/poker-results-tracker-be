import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room, User } from 'src/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { PlayerService } from 'src/player/player.service';
import { UserService } from 'src/user/user.service';
import { RoomDto } from './types/RoomDto';
import { CreateRoomDto } from './types/CreateRoomDto';
import { RoomStatusEnum } from './types/RoomStatusEnum';
import { CreatePlayerDto } from 'src/player/types/CreatePlayerDto';
import { PlayerRoleEnum } from 'src/player/types/PlayerRoleEnum';
import { PaymentTypeEnum } from 'src/payment/types/PaymentTypeEnum';
import { PaymentService } from 'src/payment/payment.service';
import { CreatePaymentDto } from 'src/payment/types/CreatePaymentDto';
import { PlayerResultDto } from 'src/player/types/PlayerResult';

@Injectable()
export class RoomService {
    constructor(
        @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
        @Inject(PlayerService) private readonly playerService: PlayerService,
        @Inject(UserService) private readonly userService: UserService,
        @Inject(PaymentService) private readonly paymentService: PaymentService,
    ) { }

    async getAll(): Promise<RoomDto[]> {
        const rooms: Room[] = await this.roomRepository.find();

        return plainToInstance(RoomDto, rooms);
    }

    async create(createRoomDto: CreateRoomDto): Promise<Room> {
        const host: User = await this.userService.getUserById(createRoomDto.hostId);

        const instance: Room = await this.roomRepository.create(createRoomDto);
        const roomId: number = (await this.roomRepository.save(instance)).id;

        const playerInstance: CreatePlayerDto = {
            roomId: roomId,
            userId: host.id,
            name: host.username
        };
        const player = await this.playerService.createPlayer(playerInstance);
        await this.playerService.changeRole({ playerId: player.id, role: PlayerRoleEnum.Host })

        const createdRoom = await this.findById(roomId);

        return createdRoom;
    }

    async findById(id: number): Promise<Room> {
        const room = await this.roomRepository.findOne({ where: { id: id }, relations: ['players', 'players.payments'] });

        if (!room) {
            throw new NotFoundException('Could not find the room by id: ' + id);
        }

        return room;
    }

    async close(id: number, playersResults: PlayerResultDto[]): Promise<Room> {
        const room = await this.findById(id);

        if (room.status === RoomStatusEnum.Closed) {
            throw new BadRequestException('The room ia already closed');
        }

        await this.calculate(id, playersResults);
        await this.roomRepository.update({ id: id }, { status: RoomStatusEnum.Closed });

        return await this.findById(id);
    }

    private async calculate(id: number, playersResults: PlayerResultDto[]): Promise<void> {
        const room: Room = await this.findById(id);

        const totalIncome: number = playersResults.reduce((sum, player) => sum += player.income, 0);
        const totalPayment: number = room.players
            .flatMap(player => player.payments)
            .filter(payment => payment !== undefined && payment.type === PaymentTypeEnum.Outcome)
            .reduce((sum, payment) => sum += payment.amount, 0);

        if (totalIncome !== totalPayment) {
            throw new InternalServerErrorException('Could not calculate income because total outcome and players chips are not equal.');
        };

        await playersResults.forEach(async player => {
            const payment: CreatePaymentDto = {
                roomId: room.id,
                playerId: player.id,
                amount: player.income,
                type: PaymentTypeEnum.Income
            }
            await this.paymentService.createPayment(payment);
        });
    }
}
