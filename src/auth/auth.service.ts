import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '@app/user/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UserService) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.getUserWithPassword(username);
    if (!user) {
      throw new UnauthorizedException('Could not find the user: ' + username);
    }
    const passwordValid = await bcrypt.compare(password, user.password);
    if (user && passwordValid) {
      return {
        userId: user.id,
        username: user.username,
      };
    }
    return null;
  }
}
