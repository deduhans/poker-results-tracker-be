import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Min } from "class-validator";

export class CreateUserDto {
    @ApiProperty()
    @IsNotEmpty()
    @Min(3)
    username: string;
}
