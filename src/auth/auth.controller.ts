import { Controller, Post, Request, UseGuards, Get } from '@nestjs/common';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { LocalAuthGuard } from 'src/auth/local.auth.guard';
import { AuthDto } from './types/AuthDto';
import { AuthenticatedGuard } from './authenticated.guard';

@Controller('auth')
export class AuthController {

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  @ApiBody({ type: AuthDto })
  async login(@Request() req): Promise<any> {
    return req.user;
  }

  @Get('/logout')
  async logout(@Request() req): Promise<boolean> {
    req.session.destroy();
    return true;
  }

  @UseGuards(AuthenticatedGuard)
  @Get('/sessionStatus')
  async isLoggedIn(@Request() req): Promise<any> {
    return req.user;
  }
}
