import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RoomStatusEnum } from './RoomStatusEnum';
import { PlayerDto } from '@app/player/types/PlayerDto';
import { CurrencyEnum } from './CurrencyEnum';
import { Exclude, Expose, Type } from 'class-transformer';

export class RoomDto {
  @ApiProperty()
  @IsInt()
  @Expose()
  id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  name: string;

  @ApiProperty()
  @IsInt()
  @Expose()
  exchange: number;

  @ApiProperty()
  @IsEnum(CurrencyEnum)
  @Expose()
  currency: CurrencyEnum;

  @ApiProperty()
  @IsInt()
  @Expose()
  baseBuyIn: number;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  isVisible: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Expose()
  accessToken?: string;

  @ApiProperty()
  @IsEnum(RoomStatusEnum)
  @IsNotEmpty()
  @Expose()
  status: RoomStatusEnum;

  @ApiProperty({ type: [PlayerDto] })
  @IsArray()
  @Type(() => PlayerDto)
  @Expose()
  players: PlayerDto[];

  @ApiProperty()
  @IsDate()
  @Expose()
  createdAt: Date;
}
