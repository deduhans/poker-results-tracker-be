import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';
import { Player } from '@entities/player.entity';

export class UserDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Expose()
  username: string;

  @ApiProperty()
  @Exclude()
  password: string;

  @ApiProperty()
  @IsDate()
  @Expose()
  createdAt: Date;

  @ApiProperty({ type: () => [Player] })
  @Expose()
  players: Player[];
}
