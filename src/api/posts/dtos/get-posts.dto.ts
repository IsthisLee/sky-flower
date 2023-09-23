import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import * as v from 'class-validator';
import { SortEnum } from 'src/common/constants/sort';

export class GetPostsQueryDto {
  @ApiProperty({
    title: '페이지 번호',
    example: 1,
    required: true,
  })
  @Transform(({ value }) => Number(value))
  @v.IsInt()
  @v.Min(1)
  page: number;

  @ApiProperty({
    title: '페이지당 게시글 수',
    example: 10,
    required: true,
  })
  @Transform(({ value }) => Number(value))
  @v.IsInt()
  @v.Min(1)
  @v.Max(100)
  limit: number;

  @ApiProperty({
    title: '정렬 기준',
    required: false,
    default: SortEnum.LIKE,
    enum: SortEnum,
  })
  @v.IsOptional()
  @v.IsEnum(SortEnum)
  sort?: SortEnum = SortEnum.LIKE;

  @ApiProperty({
    title: '사용자의 현재 위치 위도',
    description: '정렬 기준이 거리순일 경우 필수',
    required: false,
  })
  @Transform(({ value }) => Number(value))
  @v.ValidateIf((o) => o.sort === SortEnum.DISTANCE)
  @v.IsNumber(
    {},
    {
      message: '사용자의 위도는 숫자여야 합니다.',
    },
  )
  userLatitude?: number;

  @ApiProperty({
    title: '사용자의 현재 위치 경도',
    description: '정렬 기준이 거리순일 경우 필수',
    required: false,
  })
  @Transform(({ value }) => Number(value))
  @v.ValidateIf((o) => o.sort === SortEnum.DISTANCE)
  @v.IsNumber(
    {},
    {
      message: '사용자의 경도는 숫자여야 합니다.',
    },
  )
  userLongitude?: number;
}
