import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from './shared/shared.module';
import { HealthCheckerModule } from './api/health-checker/health-checker.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { AuthModule } from './api/auth/auth.module';
import { UsersModule } from './api/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env${
        process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''
      }`,
    }),
    AuthModule,
    UsersModule,
    SharedModule,
    HealthCheckerModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
