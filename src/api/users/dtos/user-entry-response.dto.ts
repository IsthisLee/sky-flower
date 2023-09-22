import { ApiProperty, PickType } from '@nestjs/swagger';

export class UserEntryResponseDto {
  @ApiProperty({
    description: '유저 ID',
    type: 'number',
  })
  userId: number;

  @ApiProperty({
    description: '유저 닉네임',
    type: 'string',
  })
  nickname: string;

  @ApiProperty({
    description: '유저 프로필 이미지 URL',
    type: 'string',
    required: false,
  })
  profileImageUrl?: string;
}

export class UpdatedUserEntryResponseDto extends PickType(
  UserEntryResponseDto,
  ['userId', 'nickname'],
) {}

export class UpdatedUserImageEntryResponseDto extends PickType(
  UserEntryResponseDto,
  ['profileImageUrl'],
) {}
