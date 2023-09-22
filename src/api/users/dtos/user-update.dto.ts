import { ApiProperty, PickType } from '@nestjs/swagger';
import { SignupDto } from 'src/api/auth/dtos/signup.dto';
import * as v from 'class-validator';
import { IsValidFilePath } from 'src/common/decorators/validator.decorators';

export class UserUpdateDto extends PickType(SignupDto, ['nickname']) {}

export class UserImageUpdateDto {
  @ApiProperty({
    example: 'profileImageUrl',
    description: '프로필 이미지 URL',
  })
  @v.IsString()
  @IsValidFilePath()
  profileImageUrl: string;
}
