import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtPayloadInfo, OauthUserInfo } from 'src/common/interface';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Provider, User } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { RequestService } from 'src/shared/services/request.service';
import { KAKAO } from 'src/common/constants';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dtos/signup.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly requestService: RequestService,
  ) {}

  async oAuthLogin(
    loginType: Provider,
    code: string,
    isLocalClient: boolean,
  ): Promise<{ accessToken: string; refreshToken: string } | string> {
    // OAuth 토큰 검증
    let oAuthUser: OauthUserInfo;
    switch (loginType) {
      case Provider.kakao:
        oAuthUser = await this.loginWithKakao(code, isLocalClient);
        break;

      default:
        throw new BadRequestException('잘못된 로그인 타입입니다.');
    }

    const user: User = await this.usersService.findOneByOAuthId(
      oAuthUser.oauthId,
      loginType,
    );

    // 가입한 적 없는 유저라면 회원가입이 진행되도록 함.
    if (!user) {
      return oAuthUser.oauthId;
    }

    // 토큰 발급
    const userPayloadInfo = this.getUserPayloadInfo(user);
    const { accessToken, refreshToken } = await this.generateTokens(
      userPayloadInfo,
    );

    return { accessToken, refreshToken };
  }

  async loginWithKakao(
    code: string,
    isLocalClient: boolean,
  ): Promise<OauthUserInfo> {
    try {
      const { access_token: accessToken, token_type: tokenType } =
        await this.getKakaoTokenInfo(code, isLocalClient);
      const profile = await this.getKakaoUserProfile(accessToken, tokenType);

      const { id } = profile;

      return {
        oauthId: id.toString(),
      };
    } catch (error) {
      if (error.status >= 500) {
        this.logger.error(error);
        throw new InternalServerErrorException('카카오 로그인에 실패했습니다.');
      }

      throw error;
    }
  }

  async getKakaoTokenInfo(code: string, isLocalClient: boolean) {
    try {
      const tokenInfo = await this.requestService.requestData({
        method: 'POST',
        url: KAKAO.TOKEN,
        config: {
          params: {
            grant_type: 'authorization_code',
            client_id: this.configService.get('KAKAO_REST_API_KEY'),
            redirect_uri: isLocalClient
              ? this.configService.get('KAKAO_LOCAL_REDIRECT_URI')
              : this.configService.get('KAKAO_REDIRECT_URI'),
            code,
          },
        },
        headers: {
          'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
          Authorization: this.configService.get('KAKAO_ADMIN_KEY'),
        },
      });

      if (!tokenInfo)
        throw new BadRequestException('카카오 토큰 정보를 가져올 수 없습니다.');

      return tokenInfo;
    } catch (error) {
      if (error.response?.data?.error_code === 'KOE320') {
        throw new UnprocessableEntityException(
          '카카오 인증 code가 유효하지 않습니다.',
        );
      }

      if (error.response?.data?.error_code === 'KOE303') {
        throw new InternalServerErrorException(
          '리다이렉트 URI가 일치하지 않습니다.',
        );
      }

      throw error;
    }
  }

  async getKakaoUserProfile(accessToken: string, tokenType: string) {
    const profile = await this.requestService.requestData({
      method: 'POST',
      url: KAKAO.PROFILE,
      headers: {
        Authorization: `${tokenType} ${accessToken}`,
      },
    });

    if (!profile || !profile.id)
      throw new BadRequestException('카카오 프로필 정보를 가져올 수 없습니다.');

    return profile;
  }

  async signup(signupDto: SignupDto) {
    const user = await this.usersService.create(signupDto);

    const userPayloadInfo = this.getUserPayloadInfo(user);
    const { accessToken, refreshToken } = await this.generateTokens(
      userPayloadInfo,
    );

    return { accessToken, refreshToken };
  }

  verifyToken(
    token: string,
    { isRefreshToken }: { isRefreshToken: boolean } = { isRefreshToken: false },
  ) {
    const payload: JwtPayloadInfo = this.jwtService.verify(token, {
      secret: this.configService.get(
        `${isRefreshToken ? 'REFRESH' : 'ACCESS'}_SECRET_KEY`,
      ),
    });

    return payload;
  }

  getUserPayloadInfo(user: User): JwtPayloadInfo {
    return {
      userId: user.id,
    };
  }

  async generateTokens(
    user: JwtPayloadInfo,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { userId: user.userId },
        {
          secret: this.configService.get('ACCESS_SECRET_KEY'),
          expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN'),
        },
      ),
      this.jwtService.signAsync(
        { userId: user.userId },
        {
          secret: this.configService.get('REFRESH_SECRET_KEY'),
          expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN'),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  setRefreshToken(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/',
      secure: this.configService.get('NODE_ENV') !== 'local',
      maxAge: 24 * 60 * 60 * 1000 * 14, // 14일
    });
  }
}
