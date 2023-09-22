import { Body, Controller, Post } from '@nestjs/common';
import { S3Service } from './s3.service';
import {
  GeneratePutPresignedUrlDto,
  GeneratePutPresignedUrlOutputDto,
} from './dtos/generate-put-presigned-url.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('s3')
@ApiTags('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('generate-put-presigned-url')
  async generatePutObjectPresignedUrl(
    @Body() generatePutPresignedUrlDto: GeneratePutPresignedUrlDto,
  ): Promise<GeneratePutPresignedUrlOutputDto> {
    return this.s3Service.generatePutObjectSignedUrl(
      generatePutPresignedUrlDto,
    );
  }
}
