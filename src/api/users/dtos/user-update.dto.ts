import { PickType } from '@nestjs/swagger';
import { SignupDto } from 'src/api/auth/dtos/signup.dto';

export class UserUpdateDto extends PickType(SignupDto, ['nickname']) {}

export class UserImageUpdateDto extends PickType(SignupDto, [
  'profileImageUrl',
]) {}
