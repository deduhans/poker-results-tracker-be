import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ExchangeDirectionEnum } from './ExchangeDirectionEnum';

export class ExchangeDto {
  @ApiProperty()
  @IsNotEmpty()
  id: number;

  @ApiProperty()
  @IsNotEmpty()
  @Min(1)
  roomId: number;

  @ApiProperty()
  @IsNotEmpty()
  playerId: number;

  @ApiProperty({ description: 'Amount of chips exchanged' })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  chipAmount: number;

  @ApiProperty({ description: 'Cash amount calculated based on room exchange rate' })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  cashAmount: number;

  @ApiProperty({
    enum: ExchangeDirectionEnum,
    description: 'Direction of the exchange (BuyIn or CashOut)',
  })
  @IsNotEmpty()
  @IsEnum(ExchangeDirectionEnum)
  direction: ExchangeDirectionEnum;

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  createdAt: Date;
}
