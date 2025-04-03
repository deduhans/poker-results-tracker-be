import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Exchange } from '@entities/exchange.entity';
import { Repository } from 'typeorm';
import { CreateExchangeDto } from '@app/exchange/types/CreateExchangeDto';
import { Player, Room } from '@entities/index';
import { RoomStatusEnum } from '@app/room/types/RoomStatusEnum';
import { ExchangeDirectionEnum } from '@app/exchange/types/ExchangeDirectionEnum';

@Injectable()
export class ExchangeService {
  constructor(
    @InjectRepository(Exchange) private readonly exchangeRepository: Repository<Exchange>,
    @InjectRepository(Player) private readonly playerRepository: Repository<Player>,
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
  ) { }

  async createExchange(createExchange: CreateExchangeDto): Promise<Exchange> {
    const { roomId, playerId, amount, type } = createExchange;

    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    const player = await this.playerRepository.findOne({
      where: { id: playerId },
      relations: ['exchanges', 'room'],
    });

    if (!room) {
      throw new NotFoundException(`Could not find room with id: ${roomId}`);
    }

    if (!player) {
      throw new NotFoundException(`Could not find player with id: ${playerId}`);
    }

    if (player.room.id !== roomId) {
      throw new BadRequestException('Player does not belong to the specified room');
    }

    if (room.status === RoomStatusEnum.Closed) {
      throw new BadRequestException('Cannot create exchange because the room is closed');
    }
    let cashAmount: number;
    let chipAmount: number;

    if (type === ExchangeDirectionEnum.BuyIn) {
      cashAmount = amount;
      chipAmount = cashAmount * room.exchange;
    } else {
      chipAmount = amount;
      cashAmount = chipAmount / room.exchange;
    }

    const exchange = this.exchangeRepository.create({
      player,
      direction: type,
      chipAmount,
      cashAmount,
    });

    return this.exchangeRepository.save(exchange);
  }

  private async calculatePlayerChipBalance(playerId: number): Promise<number> {
    const player = await this.playerRepository.findOne({
      where: { id: playerId },
      relations: ['exchanges'],
    });

    if (!player || !player.exchanges) {
      return 0;
    }

    return player.exchanges.reduce((balance, exchange) => {
      if (exchange.direction === ExchangeDirectionEnum.BuyIn) {
        return balance + exchange.chipAmount;
      } else {
        return balance - exchange.chipAmount;
      }
    }, 0);
  }
}
