import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, MinLength } from "class-validator";

export class CreatePlayerDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    roomId: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    userId: number

    @ApiProperty()
    @IsNotEmpty()
    @MinLength(3)
    name: string;
}