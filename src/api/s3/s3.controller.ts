import { Body, Controller, Post } from '@nestjs/common';
import { S3Service } from './s3.service';
import {
  GeneratePutPresignedUrlDto,
  GeneratePutPresignedUrlOutputDto,
} from './dtos/generate-put-presigned-url.dto';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('s3')
@ApiTags('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('generate-put-presigned-url')
  @ApiOperation({
    summary: 'S3 PutObject SignedUrl 생성',
    description: `
    파일 업로드를 위한 S3 PutObject SignedUrl을 생성합니다.`,
  })
  @ApiCreatedResponse({
    description: 'S3 PutObject SignedUrl 생성 성공',
    type: GeneratePutPresignedUrlOutputDto,
  })
  async generatePutObjectPresignedUrl(
    @Body() generatePutPresignedUrlDto: GeneratePutPresignedUrlDto,
  ): Promise<GeneratePutPresignedUrlOutputDto> {
    return this.s3Service.generatePutObjectSignedUrl(
      generatePutPresignedUrlDto,
    );
  }
}
