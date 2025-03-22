import { Module } from '@nestjs/common';
import { RoomController } from '@app/room/room.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment, Player, Room, User } from '@entities/index';
import { RoomService } from '@app/room/room.service';
import { PlayerService } from '@app/player/player.service';
import { UserService } from '@app/user/user.service';
import { ExchangeService } from '@app/exchange/exchange.service';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Player, User, Payment]),],
  controllers: [RoomController],
  providers: [RoomService, PlayerService, UserService, ExchangeService]
})
export class RoomModule { }
