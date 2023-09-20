import { PickType } from '@nestjs/swagger';
import { SignupDto } from './signup.dto';

export class CheckNicknameDto extends PickType(SignupDto, [
  'nickname',
] as const) {}
