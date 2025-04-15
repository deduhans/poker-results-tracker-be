import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { Player } from '@entities/player.entity';
import { ExchangeDirectionEnum } from '@app/exchange/types/ExchangeDirectionEnum';

@Entity()
export class Exchange extends BaseEntity {
  @ManyToOne(() => Player, (player) => player.exchanges)
  player: Player;

  @Column({ type: 'enum', enum: ExchangeDirectionEnum })
  direction: ExchangeDirectionEnum;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  chipAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cashAmount: number;
}
