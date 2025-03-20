import { Module } from '@nestjs/common';
import { PaymentController } from '@app/payment/payment.controller';
import { PaymentService } from '@app/payment/payment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '@entities/payment.entity';
import { Player, Room } from '@entities/index';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Room, Player]),],
  controllers: [PaymentController],
  providers: [PaymentService]
})
export class PaymentModule { }
