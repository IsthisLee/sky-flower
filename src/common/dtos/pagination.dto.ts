import { ApiProperty } from '@nestjs/swagger';

export class PageAdditionalResponseDto {
  @ApiProperty({ description: '첫 페이지인지 여부' })
  first: boolean;

  @ApiProperty({ description: '마지막 페이지인지 여부' })
  last: boolean;

  @ApiProperty({ description: '현재 페이지의 요소 수' })
  currentElements: number;

  @ApiProperty({ description: '페이지 크기' })
  size: number;

  @ApiProperty({ description: '전체 요소 수' })
  totalElements: number;

  @ApiProperty({ description: '전체 페이지 수' })
  totalPages: number;

  @ApiProperty({ description: '현재 페이지 번호' })
  currentPage: number;
}
