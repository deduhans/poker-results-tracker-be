import { PlayerRoleEnum } from 'src/player/types/PlayerRoleEnum';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Room } from './room.entity';
import { BaseEntity } from './base.entity';
import { Payment } from './payment.entity';

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