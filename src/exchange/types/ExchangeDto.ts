import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty, Min } from 'class-validator';
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
  @Min(1)
  chipAmount: number;

  @ApiProperty({ description: 'Cash amount calculated based on room exchange rate' })
  @IsNotEmpty()
  @Min(1)
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
