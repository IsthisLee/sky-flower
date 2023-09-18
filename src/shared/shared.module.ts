import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from './services/prisma.service';

const providers = [PrismaService];

@Global()
@Module({
  providers,
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  exports: [...providers, HttpModule],
})
export class SharedModule {}
