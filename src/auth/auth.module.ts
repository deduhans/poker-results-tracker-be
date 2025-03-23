import { Module } from '@nestjs/common';
import { AuthService } from '@app/auth/auth.service';
import { UserService } from '@app/user/user.service';
import { LocalStrategy } from '@app/auth/local.strategy';
import { SessionSerializer } from '@app/auth/session.serializer';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@entities/user.entity';
import { AuthController } from '@app/auth/auth.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User]), PassportModule.register({ session: true })],
  controllers: [AuthController],
  providers: [AuthService, UserService, LocalStrategy, SessionSerializer],
})
export class AuthModule {}
