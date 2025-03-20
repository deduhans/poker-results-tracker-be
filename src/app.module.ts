import { Module } from '@nestjs/common';
import { RoomModule } from '@app/room/room.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '@app/user/user.module';
import { PaymentModule } from '@app/payment/payment.module';
import { PlayerModule } from '@app/player/player.module';
import entities from './typeorm';
import { E2EModule } from '@app/e2e/e2e.module';
import { AuthModule } from '@app/auth/auth.module';
import { HealthModule } from '@app/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST'),
        port: configService.get<number>('POSTGRES_PORT') as number,
        username: configService.get('POSTGRES_NAME'),
        password: configService.get('POSTGRES_PASSWORD'),
        database: configService.get('POSTGRES_NAME'),
        entities: entities,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    RoomModule,
    UserModule,
    PaymentModule,
    PlayerModule,
    E2EModule,
    AuthModule,
    HealthModule
  ],
  controllers: [],
  providers: [],
})

export class AppModule { }
