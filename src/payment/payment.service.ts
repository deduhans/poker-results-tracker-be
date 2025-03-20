import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from '@entities/payment.entity';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from '@app/payment/types/CreatePaymentDto';
import { Player, Room } from '@entities/index';
import { RoomStatusEnum } from '@app/room/types/RoomStatusEnum';
import { PaymentTypeEnum } from '@app/payment/types/PaymentTypeEnum';

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(Payment) private readonly paymentRepository: Repository<Payment>,
        @InjectRepository(Player) private readonly playerRepository: Repository<Player>,
        @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    ) { }

    async createPayment(createPayment: CreatePaymentDto): Promise<Payment> {
        const room = await this.roomRepository.findOne({ where: { id: createPayment.roomId } });
        const player = await this.playerRepository.findOne({ where: { id: createPayment.playerId }, relations: ['payments'] });

        if (!room) {
            throw new InternalServerErrorException('Could not find a room by id: ' + createPayment.roomId);
        } else if (!player) {
            throw new InternalServerErrorException('Could not find a player by id: ' + createPayment.playerId);
        } else if (room.status === RoomStatusEnum.Closed) {
            throw new InternalServerErrorException('Could not create a payment because the room status is closed');
        }

        const instance: Payment = await this.paymentRepository.create(createPayment);
        const payment: Payment = await this.paymentRepository.save(instance);

        player.payments.push(payment);
        await this.playerRepository.save(player);

        return payment;
    }
}
