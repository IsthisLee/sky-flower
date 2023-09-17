import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

const providers = [];

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
