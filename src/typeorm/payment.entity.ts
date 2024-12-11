import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Player } from './player.entity';

@Entity()
export class Payment extends BaseEntity {
    @ManyToOne(() => Player, (player) => player.payments)
    player: Player;

    @Column({ type: 'int' })
    amount: number;
}