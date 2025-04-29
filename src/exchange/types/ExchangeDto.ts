import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ExchangeDirectionEnum } from './ExchangeDirectionEnum';
import { Expose, Transform } from 'class-transformer';

export class ExchangeDto {
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  id: number;

  @ApiProperty()
  @IsNotEmpty()
  @Min(1)
  @Expose()
  roomId: number;

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  @Transform(({ obj }) => obj.player?.id || null, { toClassOnly: true })
  playerId: number;

  @ApiProperty({ description: 'Amount of chips exchanged' })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Expose()
  chipAmount: number;

  @ApiProperty({ description: 'Cash amount calculated based on room exchange rate' })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Expose()
  cashAmount: number;

  @ApiProperty({
    enum: ExchangeDirectionEnum,
    description: 'Direction of the exchange (BuyIn or CashOut)',
  })
  @IsNotEmpty()
  @IsEnum(ExchangeDirectionEnum)
  @Expose()
  direction: ExchangeDirectionEnum;

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  @Expose()
  createdAt: Date;
}
