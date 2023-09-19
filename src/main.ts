import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { setupSwagger } from './common/swagger-setting';
import { HttpStatus } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import rateLimit from 'express-rate-limit';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local'
        ? ['error', 'warn', 'log', 'verbose', 'debug']
        : ['error', 'warn', 'log'],
  });
  const configService = app.select(AppModule).get(ConfigService);

  // 클라이언트의 실제 IP 주소를 가져오기 위함
  // (앱이 프록시 서버 뒤에 있는 경우 X-Forwarded-For 헤더에 클라이언트의 IP 주소가 포함되어 있음. 이 헤더를 신뢰한기 위한 설정)
  // 리버스 프록시 뒤에 배포된 애플리케이션에서만 활성화. 그렇지 않으면, 악의적인 사용자가 위의 헤더를 조작하여 애플리케이션을 속일 수 있음.
  app.enable('trust proxy'); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    }),
  );
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
