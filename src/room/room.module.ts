import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment, Player, Room, User } from 'src/typeorm';
import { RoomService } from './room.service';
import { PlayerService } from 'src/player/player.service';
import { UserService } from 'src/user/user.service';
import { PaymentService } from 'src/payment/payment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Player, User, Payment]),],
  controllers: [RoomController],
  providers: [RoomService, PlayerService, UserService, PaymentService]
})
export class RoomModule {}
