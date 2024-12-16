import {
    Body,
    Controller,
    Post
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { CreatePaymentDto } from './types/CreatePaymentDto';
import { PaymentDto } from './types/PaymentDto';
import { plainToInstance } from 'class-transformer';

@Controller('payments')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post()
    @ApiBody({ type: CreatePaymentDto })
    @ApiResponse({ type: PaymentDto })
    async createPayment(@Body() createPayment: CreatePaymentDto): Promise<PaymentDto> {
        const payment = await this.paymentService.createPayment(createPayment);

        return plainToInstance(PaymentDto, payment);
    }
}
