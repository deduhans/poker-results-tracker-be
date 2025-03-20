import { PlayerRoleEnum } from '@app/player/types/PlayerRoleEnum';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { User } from '@entities/user.entity';
import { Room } from '@entities/room.entity';
import { Payment } from '@entities/payment.entity';
import { BaseEntity } from '@entities/base.entity';

@Entity()
export class Player extends BaseEntity {
    @ManyToOne(() => User, (user) => user.players)
    user?: User;

    @ManyToOne(() => Room, (room) => room.players)
    room: Room;

    @OneToMany(() => Payment, (payment) => payment.player)
    payments: Payment[]

    @Column({ type: 'varchar', length: 20 })
    name: string;

    @Column({ type: 'enum', enum: PlayerRoleEnum, default: PlayerRoleEnum.Player })
    role: PlayerRoleEnum;
}