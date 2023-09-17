import { Injectable } from '@nestjs/common';
import { HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  async isHealthy(eventName: string): Promise<HealthIndicatorResult> {
    const result = await this.checkDatabaseConnection();

    if (!result) {
      return {
        [eventName]: {
          status: 'down',
        },
      };
    }

    return {
      [eventName]: {
        status: 'up',
      },
    };
  }

  private async checkDatabaseConnection(): Promise<boolean> {
    // TODO: database connection check logic
    return true;
  }
}
