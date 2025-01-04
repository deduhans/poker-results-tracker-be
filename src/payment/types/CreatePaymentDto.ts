import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, Min, MinLength } from "class-validator";
import { PaymentTypeEnum } from "./PaymentTypeEnum";

export class CreatePaymentDto {
    @ApiProperty()
    @IsNotEmpty()
    @Min(1)
    roomId: number;

    @ApiProperty()
    @IsNotEmpty()
    playerId: number;

    @ApiProperty()
    @IsNotEmpty()
    amount: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsEnum(PaymentTypeEnum)
    type: PaymentTypeEnum;
}