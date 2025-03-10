import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsNotEmpty, IsNumber, MinLength } from "class-validator";
import { PaymentDto } from "src/payment/types/PaymentDto";
import { PlayerRoleEnum } from "./PlayerRoleEnum";

export class PlayerDto {
    @ApiProperty()
    @IsNumber()
    id: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    roomId: number;

    @ApiProperty()
    @IsNotEmpty()
    @MinLength(3)
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    role: PlayerRoleEnum;

    @ApiProperty({ type: [PaymentDto] })
    payments: PaymentDto[]

    @ApiProperty()
    @IsNotEmpty()
    @IsDate()
    createdAt: Date;
}