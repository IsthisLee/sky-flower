import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from 'src/api/users/users.service';
import { JwtPayloadInfo } from 'src/common/interface';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    // token 유효 확인
    super({
      secretOrKey: configService.get<string>('REFRESH_SECRET_KEY'),
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const cookieToken = request.cookies['refreshToken'];
          return cookieToken;
        },
      ]),
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: JwtPayloadInfo,
  ): Promise<JwtPayloadInfo> {
    const { userId } = payload;
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException(
        '토큰값에 해당하는 유저가 존재하지 않습니다.',
      );
    }

    return payload; // req.user에 저장됨.
  }
}
