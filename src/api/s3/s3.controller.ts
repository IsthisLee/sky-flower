import { Body, Controller, Post } from '@nestjs/common';
import { S3Service } from './s3.service';
import {
  GeneratePutPresignedUrlDto,
  GeneratePutPresignedUrlResponseDto,
} from './dtos/generate-put-presigned-url.dto';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';

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
  @ApiExtraModels(GeneratePutPresignedUrlResponseDto)
  @ApiCreatedResponse({
    description: 'S3 PutObject SignedUrl 생성 성공',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
        },
        data: {
          $ref: getSchemaPath(GeneratePutPresignedUrlResponseDto),
        },
      },
    },
  })
  async generatePutObjectPresignedUrl(
    @Body() generatePutPresignedUrlDto: GeneratePutPresignedUrlDto,
  ): Promise<GeneratePutPresignedUrlResponseDto> {
    return this.s3Service.generatePutObjectSignedUrl(
      generatePutPresignedUrlDto,
    );
  }
}
