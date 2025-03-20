import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsDate, IsEnum, IsInt, IsNotEmpty, IsString } from "class-validator";
import { RoomStatusEnum } from "./RoomStatusEnum";
import { PlayerDto } from "@app/player/types/PlayerDto";

export class RoomDto {
    @ApiProperty()
    @IsInt()
    id: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsInt()
    exchange: number;

    @ApiProperty()
    @IsEnum({ type: RoomStatusEnum })
    @IsNotEmpty()
    status: RoomStatusEnum;

    @ApiProperty({ type: [PlayerDto] })
    @IsArray()
    players: PlayerDto[]

    @ApiProperty()
    @IsDate()
    createdAt: Date;
}