import { Module } from '@nestjs/common';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from 'src/typeorm/player.entity';
import { Room, User } from 'src/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Player, Room, User]),],
  controllers: [PlayerController],
  providers: [PlayerService]
})
export class PlayerModule { }
