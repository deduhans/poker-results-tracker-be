import { IsDate } from 'class-validator';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    hostId: number;

    @Column({type: 'varchar', length: 20})
    name: string;

    @Column({ type: 'int' })
    exchange: number;

    @Column({ type: 'varchar', length: 20 })
    status: string;

    @CreateDateColumn()
    createdAt: Date
}