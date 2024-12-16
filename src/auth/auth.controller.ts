import { Controller, Post, Request, UseGuards, Get } from '@nestjs/common';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { LocalAuthGuard } from 'src/auth/local.auth.guard';
import { AuthDto } from './types/AuthDto';

@Controller('auth')
export class AuthController {

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  @ApiBody({ type: AuthDto })
  async login(@Request() req): Promise<any> {
    return {
      User: req.user,
      message: 'User logged in'
    };
  }

  @Get('/logout')
  async logout(@Request() req): Promise<any> {
    req.session.destroy();
    return { message: 'Logged out successfully' }
  }
}
