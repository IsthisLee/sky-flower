import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from './services/prisma.service';
import { RequestService } from './services/request.service';
import { GeneratorService } from './services/generator.service';

const providers = [PrismaService, RequestService, GeneratorService];

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers,
  exports: [...providers, HttpModule],
})
export class SharedModule {}
