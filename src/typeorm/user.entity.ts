import { Entity, Column, OneToMany } from 'typeorm';
import { Player } from './player.entity';
import { BaseEntity } from './base.entity';

@Entity()
export class User extends BaseEntity {
  @Column()
  username: string;

  @Column()
  password: string

  @OneToMany(() => Player, (player) => player.user)
  players: Player[]
}
