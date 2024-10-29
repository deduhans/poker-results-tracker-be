import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Min, MinLength } from "class-validator";

export class CreatePaymentDto {

    @ApiProperty()
    @IsNotEmpty()
    @Min(1)
    roomId: number;

    @ApiProperty()
    @IsNotEmpty()
    @MinLength(3)
    playerId: number;

    @ApiProperty()
    @IsNotEmpty()
    @MinLength(3)
    amount: number;
}