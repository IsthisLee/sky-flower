import { ApiProperty } from '@nestjs/swagger';
import * as v from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'codeValue',
    description: '사용자가 카카오 로그인 성공 시에 제공되는 인가 코드입니다.',
  })
  @v.IsNotEmpty()
  @v.IsString()
  code: string;
}
