import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsNumber, MinLength } from 'class-validator';
import { ExchangeDto } from '@app/exchange/types/ExchangeDto';
import { PlayerRoleEnum } from '@app/player/types/PlayerRoleEnum';

export class PlayerDto {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  roomId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  role: PlayerRoleEnum;

  @ApiProperty({ type: [ExchangeDto] })
  payments: ExchangeDto[];

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  createdAt: Date;
}
