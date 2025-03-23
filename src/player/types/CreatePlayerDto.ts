import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreatePlayerDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Room ID is required' })
  @IsNumber({}, { message: 'Room ID must be a number' })
  roomId: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber({}, { message: 'User ID must be a number' })
  userId?: number;

  @ApiProperty({ description: 'Player name, 3-20 characters, alphanumeric with spaces' })
  @IsNotEmpty({ message: 'Player name is required' })
  @IsString({ message: 'Player name must be a string' })
  @Length(3, 20, { message: 'Player name must be between 3 and 20 characters' })
  @Matches(/^[a-zA-Z0-9\s]+$/, {
    message: 'Player name can only contain letters, numbers and spaces',
  })
  name: string;
}
