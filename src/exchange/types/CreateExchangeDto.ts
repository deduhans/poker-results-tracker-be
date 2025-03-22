import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, Min } from "class-validator";
import { ExchangeDirectionEnum } from "@app/exchange/types/ExchangeDirectionEnum";

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
    @Min(1)
    amount: number;

    @ApiProperty({ enum: ExchangeDirectionEnum, description: 'Direction of the exchange (BuyIn or CashOut)' })
    @IsNotEmpty()
    @IsEnum(ExchangeDirectionEnum)
    type: ExchangeDirectionEnum;
}