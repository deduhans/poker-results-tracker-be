import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { E2EController } from '@app/e2e/e2e.controller';
import { E2EService } from '@app/e2e/e2e.service';
import { Exchange } from '@app/typeorm/exchange.entity';
import { Player } from '@entities/player.entity';
import { Room } from '@entities/room.entity';
import { User } from '@entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Exchange, Player, Room, User])
    ],
    controllers: [E2EController],
    providers: [E2EService],
})
export class E2EModule { }
