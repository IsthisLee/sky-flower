import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { setupSwagger } from './common/swagger-setting';
import { HttpStatus } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local'
        ? ['error', 'warn', 'log', 'verbose', 'debug']
        : ['error', 'warn', 'log'],
  });
  const configService = app.select(AppModule).get(ConfigService);

  app.enableCors({
    origin: [
      configService.get('CLIENT_URL'),
      configService.get('CLIENT_LOCAL_URL'),
    ],
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );

  app.enableVersioning({
    type: VersioningType.URI,
  });

  setupSwagger(app);

  await app.listen(configService.get('PORT'), () => {
    console.log(`Server is listening on port ${configService.get('PORT')}`);
  });
}
bootstrap();
