import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsInt, IsNotEmpty, IsString } from "class-validator";
import { RoomStatus } from "./RoomStatusEnum";
import { PlayerDto } from "src/player/types/PlayerDto";

export class RoomDto {
    @ApiProperty()
    @IsInt()
    id: number;

    @ApiProperty()
    @IsInt()
    hostId: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsInt()
    exchange: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    status: RoomStatus;

    @ApiProperty({type: [PlayerDto]})
    players: PlayerDto[]

    @ApiProperty()
    @IsDate()
    createdAt: Date;
}