import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsNotEmpty, Min, MinLength } from "class-validator";

export class PaymentDto {
    @ApiProperty()
    @IsNotEmpty()
    id: number;

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

    @ApiProperty()
    @IsNotEmpty()
    @IsDate()
    createdAt: Date;
}