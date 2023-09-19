import { BadRequestException, Injectable } from '@nestjs/common';
import { Provider, User } from '@prisma/client';
import { CreateUserInfo } from '../../common/interface';
import { PrismaService } from 'src/shared/services/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findOneByOAuthId(oauthId: string, loginType: Provider): Promise<User> {
    return await this.prismaService.user.findFirst({
      where: { userOauths: { some: { provider: loginType, oauthId } } },
    });
  }

  async findOneById(
    id: number,
  ): Promise<User & { profileImage: { filePath: string } }> {
    return await this.prismaService.user.findUnique({
      where: { id },
      include: { profileImage: { select: { filePath: true } } },
    });
  }

  async create(user: CreateUserInfo, provider: Provider): Promise<User> {
    // validation
    const isExistOAuthId = await this.findOneByOAuthId(user.oauthId, provider);
    if (isExistOAuthId) {
      throw new BadRequestException('이미 가입된 회원입니다.');
    }

    // create user
    const newUserResult = await this.prismaService.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          nickname: user.nickname,
          profileImageId: user.profileImageId,
        },
      });

      await tx.userOauth.create({
        data: {
          oauthId: user.oauthId,
          provider,
          userId: newUser.id,
        },
      });

      return newUser;
    });

    return newUserResult;
  }
}
