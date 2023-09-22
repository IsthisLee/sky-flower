import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Provider, User } from '@prisma/client';
import { PrismaService } from 'src/shared/services/prisma.service';
import { UserUpdateDto } from './dtos/user-update.dto';
import { GeneratorService } from 'src/shared/services/generator.service';
import { SignupDto } from '../auth/dtos/signup.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly generatorService: GeneratorService,
  ) {}

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

  async create(signupDto: SignupDto): Promise<User> {
    const {
      oauthId,
      nickname,
      profileImageUrl,
      loginType: provider,
    } = signupDto;

    // validation
    const isExistOAuthId = await this.findOneByOAuthId(oauthId, provider);
    if (isExistOAuthId) {
      throw new BadRequestException('이미 가입된 회원입니다.');
    }

    // create user process
    const newUserResult = await this.prismaService.$transaction(async (tx) => {
      // create user
      const newUser = await tx.user.create({
        data: {
          nickname: nickname,
        },
      });

      // create user oauth
      await tx.userOauth.create({
        data: {
          oauthId: oauthId,
          provider,
          userId: newUser.id,
        },
      });

      // create profile image
      const { originalName, fileType, ext } =
        this.generatorService.fileInfoByFilePath(profileImageUrl);
      const createdFile = await tx.file.create({
        data: {
          userId: newUser.id,
          originalFileName: originalName,
          fileType,
          fileExtension: ext,
          filePath: profileImageUrl,
        },
      });
      await tx.user.update({
        where: { id: newUser.id },
        data: { profileImageId: createdFile.id },
      });

      return newUser;
    });

    return newUserResult;
  }

  async checkAvailableNickname(nickname: string): Promise<boolean> {
    const user = await this.prismaService.user.findFirst({
      where: { nickname, deletedAt: null },
    });

    return !user;
  }

  async updateProfile(userId: number, updateProfileDto: UserUpdateDto) {
    const { nickname } = updateProfileDto;

    const user = await this.prismaService.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('회원 정보를 찾을 수 없습니다.');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: { nickname },
    });

    return updatedUser;
  }

  async updateProfileImage(
    userId: number,
    profileImageUrl: string,
  ): Promise<string> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('회원 정보를 찾을 수 없습니다.');
    }

    const { originalName, fileType, ext } =
      this.generatorService.fileInfoByFilePath(profileImageUrl);

    const updatedUser = await this.prismaService.$transaction(async (tx) => {
      const createdFile = await tx.file.create({
        data: {
          userId: userId,
          originalFileName: originalName,
          fileType,
          fileExtension: ext,
          filePath: profileImageUrl,
        },
      });

      return await tx.user.update({
        where: { id: userId },
        data: { profileImageId: createdFile.id },
        include: { profileImage: { select: { filePath: true } } },
      });
    });

    return updatedUser.profileImage.filePath;
  }
}
