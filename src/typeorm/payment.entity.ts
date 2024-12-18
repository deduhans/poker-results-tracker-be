import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Player } from './player.entity';
import { PaymentTypeEnum } from 'src/payment/types/PaymentTypeEnum';

@Entity()
export class Payment extends BaseEntity {
    @ManyToOne(() => Player, (player) => player.payments)
    player: Player;

    @Column({ type: 'enum', enum: PaymentTypeEnum, default: PaymentTypeEnum.Outcome })
    type: PaymentTypeEnum;

    @Column({ type: 'int' })
    amount: number;
}