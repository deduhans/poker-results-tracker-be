import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, Min, Length } from "class-validator";

export class CreateRoomDto {
    @ApiProperty({ description: 'Room name', example: 'Friday Night Poker' })
    @IsString({ message: 'Room name must be a string' })
    @IsNotEmpty({ message: 'Room name is required' })
    @Length(3, 20, { message: 'Room name must be between 3 and 20 characters' })
    name: string;

    @ApiProperty({ description: 'Exchange rate for chips to currency', example: 100, minimum: 1 })
    @IsInt({ message: 'Exchange rate must be an integer' })
    @Min(1, { message: 'Exchange rate must be at least 1' })
    exchange: number;

    @ApiProperty({ description: 'ID of the room host', example: 1 })
    @IsInt({ message: 'Host ID must be an integer' })
    @IsNotEmpty({ message: 'Host ID is required' })
    hostId: number;
}