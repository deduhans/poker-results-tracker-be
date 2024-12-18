import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, MinLength } from "class-validator";

export class CreatePlayerDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    roomId: number;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    userId: number | null

    @ApiProperty()
    @IsNotEmpty()
    @MinLength(3)
    name: string;
}