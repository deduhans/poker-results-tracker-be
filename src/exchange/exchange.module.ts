import { Module } from '@nestjs/common';
import { ExchangeController } from '@app/exchange/exchange.controller';
import { ExchangeService } from '@app/exchange/exchange.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exchange } from '@app/typeorm/exchange.entity';
import { Player, Room } from '@entities/index';

@Module({
  imports: [TypeOrmModule.forFeature([Exchange, Room, Player]),],
  controllers: [ExchangeController],
  providers: [ExchangeService]
})
export class ExchangeModule { }
