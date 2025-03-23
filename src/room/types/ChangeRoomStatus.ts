import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { RoomStatusEnum } from './RoomStatusEnum';

export class ChangeRoomStatusDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty()
  @IsEnum(RoomStatusEnum)
  status: RoomStatusEnum;
}
