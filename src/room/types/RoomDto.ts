import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { RoomStatusEnum } from './RoomStatusEnum';
import { PlayerDto } from '@app/player/types/PlayerDto';
import { CurrencyEnum } from './CurrencyEnum';

export class RoomDto {
  @ApiProperty()
  @IsInt()
  id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsInt()
  exchange: number;

  @ApiProperty()
  @IsEnum(CurrencyEnum)
  currency: CurrencyEnum;

  @ApiProperty()
  @IsInt()
  baseBuyIn: number;

  @ApiProperty()
  @IsBoolean()
  isVisible: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Length(4, 4)
  roomKey?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  accessToken?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  requiresKey?: boolean;

  @ApiProperty()
  @IsEnum(RoomStatusEnum)
  @IsNotEmpty()
  status: RoomStatusEnum;

  @ApiProperty({ type: [PlayerDto] })
  @IsArray()
  players: PlayerDto[];

  @ApiProperty()
  @IsDate()
  createdAt: Date;
}
