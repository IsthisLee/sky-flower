import { JwtUserPayload } from 'src/common/decorators/jwt-user.decorator';
import { Body, Controller, Delete, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserImageUpdateDto, UserUpdateDto } from './dtos/user-update.dto';
import { JwtPayloadInfo } from 'src/common/interface';
import {
  UpdatedUserEntryResponseDto,
  UpdatedUserImageEntryResponseDto,
} from './dtos/user-entry-response.dto';

@Controller('users')
@ApiTags('Users - 사용자')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('profile')
  @UseGuards(AuthGuard('jwt-access'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '프로필 수정 API',
    description: `
    프로필 정보를 수정합니다.`,
  })
  @ApiExtraModels(UpdatedUserEntryResponseDto)
  @ApiOkResponse({
    description: '프로필 수정 성공',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
        },
        data: {
          $ref: getSchemaPath(UpdatedUserEntryResponseDto),
        },
      },
    },
  })
  async updateProfile(
    @JwtUserPayload() jwtUser: JwtPayloadInfo,
    @Body() updateProfileDto: UserUpdateDto,
  ): Promise<UpdatedUserEntryResponseDto> {
    const updatedUser = await this.usersService.updateProfile(
      jwtUser.userId,
      updateProfileDto,
    );
    return {
      userId: updatedUser.id,
      nickname: updatedUser.nickname,
    };
  }

  @Patch('profile-image')
  @UseGuards(AuthGuard('jwt-access'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '프로필 이미지 수정 API',
    description: `
    프로필 이미지를 수정합니다.`,
  })
  @ApiExtraModels(UpdatedUserImageEntryResponseDto)
  @ApiOkResponse({
    description: '프로필 이미지 수정 성공',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
        },
        data: {
          $ref: getSchemaPath(UpdatedUserImageEntryResponseDto),
        },
      },
    },
  })
  async updateProfileImage(
    @JwtUserPayload() jwtUser: JwtPayloadInfo,
    @Body() updateProfileImageDto: UserImageUpdateDto,
  ): Promise<UpdatedUserImageEntryResponseDto> {
    const updatedProfileImageUrl = await this.usersService.updateProfileImage(
      jwtUser.userId,
      updateProfileImageDto.profileImageUrl,
    );

    return {
      profileImageUrl: updatedProfileImageUrl,
    };
  }

  @Delete('/delete')
  @UseGuards(AuthGuard('jwt-access'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '회원 탈퇴 API',
  })
  @ApiOkResponse({ description: '회원 탈퇴 성공' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async deleteAccount(@JwtUserPayload() jwtUser: JwtPayloadInfo) {
    await this.usersService.deleteAccount(jwtUser.userId);
  }
}
