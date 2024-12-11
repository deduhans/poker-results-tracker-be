import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, MinLength } from "class-validator";
import { PlayerRoleEnum } from "./PlayerRoleEnum";

export class ChangePlayerRole {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    playerId: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsEnum(PlayerRoleEnum)
    role: PlayerRoleEnum;
}