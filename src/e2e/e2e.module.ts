import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { E2EController } from '@app/e2e/e2e.controller';
import { E2EService } from '@app/e2e/e2e.service';
import { Payment } from '@entities/payment.entity';
import { Player } from '@entities/player.entity';
import { Room } from '@entities/room.entity';
import { User } from '@entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Payment, Player, Room, User])
    ],
    controllers: [E2EController],
    providers: [E2EService],
})
export class E2EModule { }
