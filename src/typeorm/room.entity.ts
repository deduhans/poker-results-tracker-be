import { Column, Entity, OneToMany } from 'typeorm';
import { Player } from './player.entity';
import { BaseEntity } from './base.entity';
import { RoomStatusEnum } from '../room/types/RoomStatusEnum';
import { CurrencyEnum } from '../room/types/CurrencyEnum';

@Entity()
export class Room extends BaseEntity {
  @OneToMany(() => Player, (player) => player.room, { cascade: true })
  players: Player[];

  @Column({ type: 'varchar', length: 20 })
  name: string;

  @Column({ type: 'int' })
  exchange: number;

  @Column({ type: 'enum', enum: CurrencyEnum, default: CurrencyEnum.USD })
  currency: CurrencyEnum;

  @Column({ type: 'int', default: 50 })
  baseBuyIn: number;

  @Column({ type: 'boolean', default: true })
  isVisible: boolean;

  @Column({ type: 'varchar', length: 64, nullable: true })
  accessToken: string;

  @Column({ type: 'enum', enum: RoomStatusEnum, default: RoomStatusEnum.Opened })
  status: RoomStatusEnum;
}
