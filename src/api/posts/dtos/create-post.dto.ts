import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import * as v from 'class-validator';
import { IsValidFilePath } from 'src/common/decorators/validator.decorators';

export class CreatePostDto {
  @ApiProperty({
    title: '게시글 사진 URL',
    required: true,
  })
  @v.IsString()
  @v.IsNotEmpty()
  @IsValidFilePath()
  photoUrl: string;

  @ApiProperty({
    title: '게시글 지도 마커 사진 URL',
    required: true,
  })
  @v.IsString()
  @v.IsNotEmpty()
  @IsValidFilePath()
  markerPhotoUrl: string;

  @ApiProperty({
    title: '위도',
    required: true,
  })
  @v.IsNumber()
  @v.IsNotEmpty()
  latitude: number;

  @ApiProperty({
    title: '경도',
    required: true,
  })
  @v.IsNumber()
  @v.IsNotEmpty()
  longitude: number;

  @ApiPropertyOptional({
    title: '주소',
    required: false,
  })
  @v.IsOptional()
  @v.IsString()
  @v.IsNotEmpty()
  address: string;

  @ApiPropertyOptional({
    title: '시도 행정지역명',
    required: false,
  })
  @v.IsOptional()
  @v.IsString()
  @v.IsNotEmpty()
  cityName: string;

  @ApiPropertyOptional({
    title: '시군구 행정지역명',
    required: false,
  })
  @v.IsOptional()
  @v.IsString()
  @v.IsNotEmpty()
  districtName: string;

  @ApiPropertyOptional({
    title: '읍면동 행정지역명',
    required: false,
  })
  @v.IsOptional()
  @v.IsString()
  @v.IsNotEmpty()
  townName: string;
}
