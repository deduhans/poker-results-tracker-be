import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Timestamp } from 'typeorm';

@Entity()
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    playerId: number;

    @Column({ type: 'int' })
    roomId: number;

    @Column({ type: 'int' })
    amount: number;

    @CreateDateColumn()
    createdAt: Date
}