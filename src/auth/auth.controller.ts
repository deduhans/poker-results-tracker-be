import { Controller, Post, Request, UseGuards, Get } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { LocalAuthGuard } from '@app/auth/local.auth.guard';
import { AuthDto } from '@app/auth/types/AuthDto';
import { JwtAuthGuard } from '@app/auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(private jwtService: JwtService) { }

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  @ApiBody({ type: AuthDto })
  async login(@Request() req): Promise<any> {
    const payload = { username: req.user.username, sub: req.user.userId };
    return {
      ...req.user,
      access_token: this.jwtService.sign(payload),
    };
  }

  @Get('/logout')
  async logout(): Promise<boolean> {
    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/sessionStatus')
  async isLoggedIn(@Request() req): Promise<any> {
    return req.user;
  }
}
