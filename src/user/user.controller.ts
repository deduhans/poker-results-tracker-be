import { Controller, Post, Body, Request, UseGuards, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { CreateUserDto } from './types/CreateUserDto';
import { UserDto } from './types/UserDto';
import { LocalAuthGuard } from 'src/auth/local.auth.guard';
import { AuthenticatedGuard } from 'src/auth/authenticated.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, type: UserDto })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    return await this.userService.createUser(createUserDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  @ApiBody({ type: CreateUserDto })
  async login(@Request() req): Promise<any> {
    return {
      User: req.user,
      msg: 'User logged in'
    };
  }

  @UseGuards(AuthenticatedGuard)
  @Get('/protected')
  async getHello(@Request() req): Promise<string> {
    return req.user;
  }

  @Get('/logout')
  async logout(@Request() req): Promise<any> {
    req.session.destroy();
    return { msg: 'The user session has ended' }
  }
}
