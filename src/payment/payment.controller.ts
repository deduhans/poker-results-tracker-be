import {
    Body,
    Controller,
    NotImplementedException,
    Post,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { CreatePaymentDto } from './types/CreatePaymentDto';
import { PaymentDto } from './types/PaymentDto';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('create')
    @ApiBody({type: CreatePaymentDto})
    @ApiResponse({type: PaymentDto})
    async createPayment(@Body() createPayment: CreatePaymentDto): Promise<PaymentDto> {
        return await this.paymentService.createPayment(createPayment);
    }
}
