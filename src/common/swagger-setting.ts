import { INestApplication } from '@nestjs/common';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from '@nestjs/swagger';

// To keep alive authentication even after refreshing
const swaggerCustomOptions: SwaggerCustomOptions = {
  swaggerOptions: { persistAuthorization: true },
};

export const setupSwagger = (app: INestApplication): void => {
  const config = new DocumentBuilder()
    .setTitle('Sky Flower(하늘바라기) API Docs')
    .setDescription(
      'Sky-Flower(하늘바라기) API 명세서입니다~ \n\n 궁금한 점은 언제든지 물어봐 주세요~',
    )
    .setVersion('0.0.1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        name: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, swaggerCustomOptions);
};
