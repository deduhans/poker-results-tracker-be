import { Column, Entity, OneToMany } from 'typeorm';
import { Player } from './player.entity';
import { BaseEntity } from './base.entity';
import { RoomStatusEnum } from 'src/room/types/RoomStatusEnum';

@Entity()
export class Room extends BaseEntity {
    @OneToMany(() => Player, (player) => player.room)
    players: Player[];

    @Column({ type: 'varchar', length: 20 })
    name: string;

    @Column({ type: 'int' })
    exchange: number;

    @Column({ type: 'enum', enum: RoomStatusEnum, default: RoomStatusEnum.Opened })
    status: RoomStatusEnum;
}