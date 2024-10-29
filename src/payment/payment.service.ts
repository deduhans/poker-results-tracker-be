import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Payment } from 'src/typeorm/payment.entity';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './types/CreatePaymentDto';
import { PaymentDto } from './types/PaymentDto';

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(Payment) private readonly paymentRepository: Repository<Payment>,
    ) { }

    async createPayment(createPayment: CreatePaymentDto): Promise<PaymentDto> {
        const instance: Payment = await this.paymentRepository.create(createPayment);
        const newPayment: Payment = await this.paymentRepository.save(instance);

        return plainToInstance(PaymentDto, newPayment);
    }
}
