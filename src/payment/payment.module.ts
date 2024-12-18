import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from 'src/typeorm/payment.entity';
import { Player, Room } from 'src/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Room, Player]),],
  controllers: [PaymentController],
  providers: [PaymentService]
})
export class PaymentModule {}
