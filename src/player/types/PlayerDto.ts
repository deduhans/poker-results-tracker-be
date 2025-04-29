import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { ExchangeDto } from '@app/exchange/types/ExchangeDto';
import { PlayerRoleEnum } from '@app/player/types/PlayerRoleEnum';
import { Exclude, Expose, Transform, Type } from 'class-transformer';

export class PlayerDto {
  @ApiProperty()
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  roomId: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  @Expose()
  @Transform(({ obj }) => obj.user?.id || null, { toClassOnly: true })
  userId: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  @Transform(({ obj }) => obj.user?.username || null, { toClassOnly: true })
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  @MinLength(3)
  @Expose()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  role: PlayerRoleEnum;

  @ApiProperty({ type: [ExchangeDto] })
  @Type(() => ExchangeDto)
  @Expose()
  exchanges: ExchangeDto[];

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  @Expose()
  createdAt: Date;

  @Exclude()
  user?: any;
}
