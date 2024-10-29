import { PlayerRole } from 'src/player/types/PlayerRoleEnum';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Player {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'integer'})
    roomId: number;

    @Column({ type: 'varchar', length: 20 })
    name: string;

    @Column({ type: 'varchar' })
    role: PlayerRole;
}