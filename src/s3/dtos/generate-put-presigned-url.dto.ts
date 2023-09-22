import { ApiProperty } from '@nestjs/swagger';
import * as v from 'class-validator';

export class GeneratePutPresignedUrlDto {
  @ApiProperty({
    description: '원본 파일 이름',
    type: 'string',
  })
  @v.IsString()
  originalFileName: string;

  @ApiProperty({
    description: '파일 형식',
    type: 'string',
  })
  @v.IsString()
  @v.IsIn(['image/jpeg', 'image/png'])
  mimetype: string;
}

export class GeneratePutPresignedUrlOutputDto {
  @ApiProperty({
    description: 'put preSigned URL',
    type: 'string',
  })
  @v.IsString()
  signedUrl: string;

  @ApiProperty({
    description: '파일 이름',
    type: 'string',
  })
  @v.IsString()
  fileName: string;
}
