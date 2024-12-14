import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from 'src/typeorm/payment.entity';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './types/CreatePaymentDto';

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(Payment) private readonly paymentRepository: Repository<Payment>,
    ) { }

    async createPayment(createPayment: CreatePaymentDto): Promise<Payment> {
        const instance: Payment = await this.paymentRepository.create(createPayment);
        const payment: Payment = await this.paymentRepository.save(instance);

        return payment;
    }
}
