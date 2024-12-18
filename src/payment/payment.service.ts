import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from 'src/typeorm/payment.entity';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './types/CreatePaymentDto';
import { Player, Room } from 'src/typeorm';
import { RoomStatusEnum } from 'src/room/types/RoomStatusEnum';
import { PaymentTypeEnum } from './types/PaymentTypeEnum';

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(Payment) private readonly paymentRepository: Repository<Payment>,
        @InjectRepository(Player) private readonly playerRepository: Repository<Player>,
        @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    ) { }

    async createPayment(createPayment: CreatePaymentDto): Promise<Payment> {
        const room = await this.roomRepository.findOne({where: {id: createPayment.roomId}});
        const player = await this.playerRepository.findOne({where: {id: createPayment.playerId}, relations: ['payments']});
        
        if(!room) {
            throw new InternalServerErrorException('Could not find a room by id: ' + createPayment.roomId);
        } else if (!player) {
            throw new InternalServerErrorException('Could not find a player by id: ' + createPayment.playerId);
        } else if (room.status === RoomStatusEnum.Closed) {
            throw new InternalServerErrorException('Could not create a payment because the room status is closed');
        }

        if(createPayment.type === PaymentTypeEnum.Income) {
            const payments = await this.paymentRepository.find({where: {player: player}});
            const totalAmount = payments.reduce((sum, current) => sum + current.amount, 0);

            if(totalAmount < createPayment.amount) {
                throw new InternalServerErrorException('Could not create a payment because income is bigger than outcome');
            }
        }

        const instance: Payment = await this.paymentRepository.create(createPayment);
        const payment: Payment = await this.paymentRepository.save(instance);

        return payment;
    }
}
