import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Min } from "class-validator";

export class AuthDto {
    @ApiProperty()
    @IsNotEmpty()
    @Min(3)
    username: string;

    @ApiProperty()
    @IsNotEmpty()
    @Min(3)
    password: string;
}
