import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsNotEmpty, IsNumber, MinLength } from "class-validator";

export class UserDto {
    @ApiProperty()
    @IsNumber()
    id: number;

    @ApiProperty()
    @IsNotEmpty()
    @MinLength(3)
    username: string;

    @ApiProperty()
    @IsNotEmpty()
    @MinLength(3)
    password: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsDate()
    createdAt: Date;
}