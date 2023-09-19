import { ApiProperty } from '@nestjs/swagger';
import { Provider } from '@prisma/client';
import * as v from 'class-validator';

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
  nickname: string;

  @ApiProperty({
    description: '로그인 타입',
    enum: Provider,
    default: Provider.kakao,
  })
  @v.IsNotEmpty()
  @v.IsEnum(Provider)
  loginType: Provider = Provider.kakao;
}
