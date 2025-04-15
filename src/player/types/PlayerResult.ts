import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber } from 'class-validator';

export class PlayerResultDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  income: number;
}
