import { ApiProperty } from '@nestjs/swagger';
import * as v from 'class-validator';
import { FileExtEnum } from 'src/common/constants';

export class GeneratePutPresignedUrlDto {
  @ApiProperty({
    description: '원본 파일 이름',
    type: 'string',
  })
  @v.IsString()
  originalFileName: string;

  @ApiProperty({
    description: '파일 확장자',
    type: 'string',
  })
  @v.IsString()
  @v.IsEnum(FileExtEnum, {
    message: `fileExtension은 ${FileExtEnum.JPG}, ${FileExtEnum.PNG} 중 하나여야 합니다.`,
  })
  fileExtension: string;

  @ApiProperty({
    title: '파일 크기',
    description: `최대 파일 크기는 500MB(1024 * 1024 * 500)입니다. 
      preSigned URL 생성 요청 시의 파일 크기와 업로드 시의 파일 크기가 다를 경우, 업로드가 실패합니다.`,
    type: 'number',
  })
  @v.IsPositive()
  @v.IsInt()
  @v.Min(1)
  @v.Max(1024 * 1024 * 500) // 500MB
  contentLength: number;
}

export class GeneratePutPresignedUrlResponseDto {
  @ApiProperty({
    description: 'put preSigned URL',
    type: 'string',
  })
  @v.IsString()
  signedUrl: string;

  @ApiProperty({
    description: '생성되는 파일 경로',
    type: 'string',
  })
  @v.IsString()
  s3Url: string;
}
