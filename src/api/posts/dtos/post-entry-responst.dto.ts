import { ApiProperty } from '@nestjs/swagger';

export class PostEntryResponseDto {
  @ApiProperty({
    title: '게시글 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    title: '유저 ID',
    example: 1,
  })
  userId: number;

  @ApiProperty({
    title: '유저 닉네임',
    example: '김철수',
  })
  userNickname: string;

  @ApiProperty({
    title: '유저 프로필 사진 경로',
    example: 'https://s3.image.url',
  })
  userProfileUrl: string;

  @ApiProperty({
    title: '장소',
    example: '오늘도 맑군',
  })
  address: string;

  @ApiProperty({
    title: '장소 위도',
    example: 37.123456,
  })
  latitude: number;

  @ApiProperty({
    title: '장소 경도',
    example: 127.123456,
  })
  longitude: number;

  @ApiProperty({
    title: '게시글 사진 경로',
    example: 'https://s3.image.url',
  })
  photoUrl: string;

  @ApiProperty({
    title: '좋아요 수',
    example: 10,
  })
  likeCount: number;

  @ApiProperty({
    title: '내가 좋아요를 눌렀는지 여부',
    example: true,
  })
  isLiked: boolean;
}
