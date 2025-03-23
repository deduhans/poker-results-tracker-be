import { Module } from '@nestjs/common';
import { HealthController } from '@app/health/health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
