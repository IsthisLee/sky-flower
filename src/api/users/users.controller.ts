import { JwtUserPayload } from 'src/common/decorators/jwt-user.decorator';
import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserUpdateDto } from './dtos/user-update.dto';
import { JwtPayloadInfo } from 'src/common/interface';
import { UpdatedUserEntryResponseDto } from './dtos/user-entry-response.dto';

@Controller('users')
@ApiTags('Users - 사용자')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('profile')
  @UseGuards(AuthGuard('jwt-access'))
  @ApiBearerAuth('access-token')
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
}
