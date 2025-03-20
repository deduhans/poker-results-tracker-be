import { Entity, Column, OneToMany } from 'typeorm';
import { Player } from '@entities/player.entity';
import { BaseEntity } from '@entities/base.entity';

@Entity()
export class User extends BaseEntity {
  @Column()
  username: string;

  @Column()
  password: string

  @OneToMany(() => Player, (player) => player.user)
  players: Player[]
}
