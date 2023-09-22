import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Provider } from '@prisma/client';
import * as v from 'class-validator';
import { IsValidFilePath } from 'src/common/decorators/validator.decorators';

export class SignupDto {
  @ApiProperty({
    example: 'oauthId',
    description: 'OAuth ID',
  })
  @v.IsNotEmpty()
  @v.IsString()
  oauthId: string;

  @ApiProperty({
    example: 'nickname',
    description: '사용자 닉네임',
  })
  @v.IsNotEmpty()
  @v.IsString()
  @v.Length(1, 10, {
    message: '닉네임은 1글자 이상 10글자 이하로 입력해주세요.',
  })
  @v.Matches(/^[a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣]*$/, {
    message: '닉네임에 특수문자는 입력할 수 없습니다.',
  })
  nickname: string;

  @ApiProperty({
    description: '로그인 타입',
    enum: Provider,
    default: Provider.kakao,
  })
  @v.IsNotEmpty()
  @v.IsEnum(Provider)
  loginType: Provider = Provider.kakao;

  @ApiPropertyOptional({
    example: 'profileImageUrl',
    required: false,
    description: '프로필 이미지 URL',
  })
  @v.IsOptional()
  @v.IsString()
  @IsValidFilePath()
  profileImageUrl?: string;
}
