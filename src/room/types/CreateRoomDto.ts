import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min, Length, IsEnum, IsOptional, IsBoolean, Matches } from 'class-validator';
import { CurrencyEnum } from './CurrencyEnum';

export class CreateRoomDto {
  @ApiProperty({ description: 'Room name', example: 'Friday Night Poker' })
  @IsString({ message: 'Room name must be a string' })
  @IsNotEmpty({ message: 'Room name is required' })
  @Length(3, 20, { message: 'Room name must be between 3 and 20 characters' })
  name: string;

  @ApiProperty({ description: 'Exchange rate for chips to currency', example: 100, minimum: 1 })
  @IsInt({ message: 'Exchange rate must be an integer' })
  @Min(1, { message: 'Exchange rate must be at least 1' })
  exchange: number;

  @ApiProperty({ description: 'Base buy-in amount', example: 50, minimum: 1, maximum: 10000 })
  @IsInt({ message: 'Base buy-in must be an integer' })
  @Min(1, { message: 'Base buy-in must be at least 1' })
  @IsOptional()
  baseBuyIn?: number;

  @ApiProperty({ description: 'Currency for the room', example: 'USD', enum: CurrencyEnum })
  @IsEnum(CurrencyEnum, { message: 'Currency must be one of: USD, EUR, PLN, UAH' })
  @IsOptional()
  currency?: CurrencyEnum;

  @ApiProperty({ description: 'Whether the room is visible in the room list', example: true })
  @IsBoolean({ message: 'isVisible must be a boolean' })
  @IsOptional()
  isVisible?: boolean;

  @ApiProperty({ description: 'Key required to join a room (4 digits)', example: '1234' })
  @IsOptional()
  @IsString({ message: 'Room key must be a string' })
  @Length(4, 4, { message: 'Room key must be exactly 4 digits' })
  @Matches(/^[0-9]{4}$/, { message: 'Room key must contain exactly 4 digits' })
  roomKey?: string;

  @ApiProperty({ description: 'ID of the room host', example: 1 })
  @IsInt({ message: 'Host ID must be an integer' })
  @IsNotEmpty({ message: 'Host ID is required' })
  hostId: number;
}
