import { PlayerRoleEnum } from '@app/player/types/PlayerRoleEnum';
import { Column, Entity, ManyToOne, OneToMany, Unique } from 'typeorm';
import { User } from '@entities/user.entity';
import { Room } from '@entities/room.entity';
import { Exchange } from '@app/typeorm/exchange.entity';
import { BaseEntity } from '@entities/base.entity';

@Entity()
@Unique(['user', 'room'])
export class Player extends BaseEntity {
    @ManyToOne(() => User, (user) => user.players)
    user?: User;

    @ManyToOne(() => Room, (room) => room.players)
    room: Room;

    @OneToMany(() => Exchange, (payment) => payment.player)
    exchanges: Exchange[]

    @Column({ type: 'varchar', length: 20 })
    name: string;

    @Column({ type: 'enum', enum: PlayerRoleEnum, default: PlayerRoleEnum.Player })
    role: PlayerRoleEnum;
}