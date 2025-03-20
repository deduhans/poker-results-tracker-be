import { Module } from '@nestjs/common';
import { PlayerController } from '@app/player/player.controller';
import { PlayerService } from '@app/player/player.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from '@entities/player.entity';
import { Room, User } from '@entities/index';

@Module({
  imports: [TypeOrmModule.forFeature([Player, Room, User]),],
  controllers: [PlayerController],
  providers: [PlayerService]
})
export class PlayerModule { }
