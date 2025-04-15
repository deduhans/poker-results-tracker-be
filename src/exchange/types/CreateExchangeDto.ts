import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ExchangeDirectionEnum } from '@app/exchange/types/ExchangeDirectionEnum';

export class CreateExchangeDto {
  @ApiProperty()
  @IsNotEmpty()
  @Min(1)
  roomId: number;

  @ApiProperty()
  @IsNotEmpty()
  playerId: number;

  @ApiProperty({ description: 'Amount of chips to buy or cash out' })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({
    enum: ExchangeDirectionEnum,
    description: 'Direction of the exchange (BuyIn or CashOut)',
  })
  @IsNotEmpty()
  @IsEnum(ExchangeDirectionEnum)
  type: ExchangeDirectionEnum;
}
