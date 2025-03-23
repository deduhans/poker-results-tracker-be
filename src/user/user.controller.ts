import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from '@app/user/user.service';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { CreateUserDto } from '@app/user/types/CreateUserDto';
import { UserDto } from '@app/user/types/UserDto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, type: UserDto })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    return await this.userService.createUser(createUserDto);
  }
}
