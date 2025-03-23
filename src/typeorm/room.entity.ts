import { Column, Entity, OneToMany } from 'typeorm';
import { Player } from '@entities/player.entity';
import { BaseEntity } from '@entities/base.entity';
import { RoomStatusEnum } from '@app/room/types/RoomStatusEnum';

@Entity()
export class Room extends BaseEntity {
  @OneToMany(() => Player, (player) => player.room, { cascade: true })
  players: Player[];

  @Column({ type: 'varchar', length: 20 })
  name: string;

  @Column({ type: 'int' })
  exchange: number;

  @Column({ type: 'enum', enum: RoomStatusEnum, default: RoomStatusEnum.Opened })
  status: RoomStatusEnum;
}
