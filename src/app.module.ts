import { Module } from '@nestjs/common';
import { RoomModule } from './room/room.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { PaymentModule } from './payment/payment.module';
import { PlayerModule } from './player/player.module';
import entities from './typeorm';
import { E2EModule } from './e2e/e2e.module';
import { AuthModule } from './auth/auth.module';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `./env/.env.local`
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
    AuthModule
  ],
  controllers: [],
  providers: [],
})

export class AppModule { }
