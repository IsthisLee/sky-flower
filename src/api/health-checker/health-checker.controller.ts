import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  type HealthCheckResult,
  HealthCheckService,
} from '@nestjs/terminus';

import { DatabaseHealthIndicator } from './health-indicators/database.indicator';
import { ApiTags } from '@nestjs/swagger';

@Controller('health')
@ApiTags('Health - 서버 상태 확인')
export class HealthCheckerController {
  constructor(
    private healthCheckService: HealthCheckService,
    private databaseIndicator: DatabaseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      () => this.databaseIndicator.isHealthy('database'),
    ]);
  }
}
