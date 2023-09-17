import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthCheckerController } from './health-checker.controller';
import { DatabaseHealthIndicator } from './health-indicators/database.indicator';

@Module({
  imports: [TerminusModule],
  controllers: [HealthCheckerController],
  providers: [DatabaseHealthIndicator],
})
export class HealthCheckerModule {}
