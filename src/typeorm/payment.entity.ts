import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { Player } from '@entities/player.entity';
import { PaymentTypeEnum } from '@app/payment/types/PaymentTypeEnum';

@Entity()
export class Payment extends BaseEntity {
    @ManyToOne(() => Player, (player) => player.payments)
    player: Player;

    @Column({ type: 'enum', enum: PaymentTypeEnum, default: PaymentTypeEnum.Outcome })
    type: PaymentTypeEnum;

    @Column({ type: 'int' })
    amount: number;
}