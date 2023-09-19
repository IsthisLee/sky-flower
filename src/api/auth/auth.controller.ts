import {
  Controller,
  Param,
  ParseEnumPipe,
  Res,
  Post,
  UseGuards,
  Get,
  Body,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiUnprocessableEntityResponse,
  getSchemaPath,
  ApiExtraModels,
  ApiPayloadTooLargeResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Provider } from '@prisma/client';
import { Response } from 'express';
import { LoginDto } from './dtos/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtUserPayload } from 'src/common/decorators/jwt-user.decorator';
import { JwtPayloadInfo, GetUserInfo } from 'src/common/interface';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dtos/signup.dto';
import { UserEntryResponseDto } from '../users/dtos/user-entry-response.dto';
import { ApiFile } from 'src/common/decorators/swagger.schema';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('/login/:login_type')
  @ApiOperation({
    summary: '소셜 로그인 API',
    description: `
    로그인 성공 시 jwt token을 발급합니다.`,
  })
  @ApiParam({
    name: 'login_type',
    enum: Provider,
    enumName: 'Provider',
  })
  @ApiResponse({
    status: 200,
    description: '로그인 성공 / 회원가입 필요',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            data: {
              oneOf: [
                {
                  type: 'object',
                  properties: {
                    needSignup: {
                      type: 'boolean',
                    },
                    accessToken: {
                      type: 'string',
                    },
                  },
                },
                {
                  type: 'object',
                  properties: {
                    needSignup: {
                      type: 'boolean',
                    },
                    oauthId: {
                      type: 'string',
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: '로그인에 실패했을 경우',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            statusCode: {
              type: 'number',
              example: 400,
            },
            message: {
              type: 'string',
            },
            detail: {
              type: 'string',
              example: 'Bad Request',
            },
          },
        },
      },
    },
  })
  @ApiUnprocessableEntityResponse({
    description: '카카오 인증 code가 유효하지 않을 경우',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            statusCode: {
              type: 'number',
              example: 422,
            },
            message: {
              type: 'string',
              example: '카카오 code가 유효하지 않습니다.',
            },
            detail: {
              type: 'string',
              example: 'Unprocessable Entity',
            },
          },
        },
      },
    },
  })
  async oAuthLogin(
    @Res({ passthrough: true }) res: Response,
    @Param('login_type', new ParseEnumPipe(Provider))
    login_type: Provider,
    @Body() loginDto: LoginDto,
  ) {
    const loginResult = await this.authService.oAuthLogin(
      login_type,
      loginDto.code,
    );
    if (typeof loginResult === 'string') {
      return { needSignup: true, oauthId: loginResult };
    }

    const { accessToken, refreshToken } = loginResult;
    this.authService.setRefreshToken(res, refreshToken);

    return { needSignup: false, accessToken };
  }

  @Post('/signup')
  @ApiOperation({
    summary: '회원가입 API',
    description: `
    회원가입 완료 시 jwt token을 발급합니다.`,
  })
  @ApiFile({ name: 'profileImage' })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            data: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: '회원가입에 실패했을 경우',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            statusCode: {
              type: 'number',
              example: 400,
            },
            message: {
              type: 'string',
            },
            detail: {
              type: 'string',
              example: 'Bad Request',
            },
          },
        },
      },
    },
  })
  @ApiPayloadTooLargeResponse({
    description: '프로필 이미지 용량이 너무 큰 경우 (500MB 이상)',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            statusCode: {
              type: 'number',
              example: 413,
            },
            message: {
              type: 'string',
              example: 'File too large',
            },
            detail: {
              type: 'string',
              example: 'PayloadTooLargeException',
            },
          },
        },
      },
    },
  })
  async signup(
    @Res({ passthrough: true }) res: Response,
    @Body() signupDto: SignupDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('file: ', file);
    const { accessToken, refreshToken } = await this.authService.signup(
      signupDto,
    );
    this.authService.setRefreshToken(res, refreshToken);
    return { accessToken };
  }

  @Get('/me')
  @UseGuards(AuthGuard('jwt-access'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '내 정보 조회 API',
    description: `
    로그인 상태인 경우 내 정보를 조회합니다.
    로그인 상태가 아닌 경우 401 에러가 발생합니다.`,
  })
  @ApiExtraModels(UserEntryResponseDto)
  @ApiResponse({
    status: 200,
    description: '내 정보 조회 성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            data: {
              $ref: getSchemaPath(UserEntryResponseDto),
            },
          },
        },
      },
    },
  })
  async getMyInfo(
    @JwtUserPayload() jwtUser: JwtPayloadInfo,
  ): Promise<GetUserInfo> {
    const user = await this.usersService.findOneById(jwtUser.userId);
    return {
      userId: user.id,
      nickname: user.nickname,
      profileImageUrl: user.profileImage?.filePath,
    };
  }

  @Post('/silent-refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @ApiOperation({
    summary: '토큰 리프레시 API (현재는 미사용)',
    description: `
    AT 만료 시 쿠키에 담겨오는 RT를 활용하여 AT를 refresh합니다.`,
  })
  async refreshToken(@JwtUserPayload() jwtUser: JwtPayloadInfo) {
    const { accessToken } = await this.authService.generateTokens(jwtUser);

    return { accessToken };
  }
}
