import { FileInfoSaveService } from '../../shared/services/file-info-save.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { GetPostsQueryDto } from './dtos/get-posts.dto';
import { SortEnum } from 'src/common/constants/sort';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { PostEntryResponseDto } from './dtos/post-entry-responst.dto';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileInfoSaveService: FileInfoSaveService,
  ) {}

  async createPost(userId: number, createPostDto: CreatePostDto) {
    const {
      photoUrl,
      latitude,
      longitude,
      address,
      cityName,
      districtName,
      townName,
    } = createPostDto;

    const newPost = await this.prisma.$transaction(async (tx) => {
      // save file info
      const savedFileInfo = await this.fileInfoSaveService.saveFile(
        tx,
        userId,
        photoUrl,
      );

      // create post
      const newPost = await this.prisma.post.create({
        data: {
          address,
          userId,
          latitude,
          longitude,
          city: cityName,
          district: districtName,
          town: townName,
        },
      });

      // create post-file relation
      await tx.postFile.create({
        data: {
          postId: newPost.id,
          fileId: savedFileInfo.id,
        },
      });

      return newPost;
    });

    return newPost;
  }

  // TODO: Prisma.postGetPayload를 통해 타입 정의
  private getPostResponse(post: any): PostEntryResponseDto {
    return {
      id: post.id,
      userId: post.user.id,
      userNickname: post.user.nickname,
      address: post.address,
      latitude: post.latitude,
      longitude: post.longitude,
      photoUrl: post.postFiles[0].file.filePath,
      likeCount: post.postLikes.length,
      isLiked: post.postLikes.some(
        (postLike) => postLike.userId === post.user.id,
      ),
    };
  }

  async getPosts(
    getPostsQuery: GetPostsQueryDto,
  ): Promise<PostEntryResponseDto[]> {
    const { page, limit, sort, userLatitude, userLongitude } = getPostsQuery;

    if (sort === SortEnum.DISTANCE) {
      const query = `SELECT *, earth_distance(
        ll_to_earth(CAST(${userLatitude} as float), CAST(${userLongitude} as float)),
        ll_to_earth(CAST("latitude" as float), CAST("longitude" as float))
        ) as distance
        FROM "skyflower"."Post"
        ORDER BY distance ASC
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `;
      // TODO: Prisma.postGetPayload를 통해 타입 정의
      const posts: any[] = await this.prisma.$queryRawUnsafe(query);

      const responsePosts = posts.map((post) => this.getPostResponse(post));

      return responsePosts;
    } else {
      let orderBy:
        | Prisma.PostOrderByWithRelationInput
        | Prisma.PostOrderByWithRelationInput[];
      let postLikesWhere: Prisma.PostLikeWhereInput = {};

      switch (sort) {
        case SortEnum.LIKE:
          const today4AM = dayjs().startOf('day').add(4, 'hour');
          const filterDate = today4AM.isAfter(dayjs())
            ? dayjs().subtract(1, 'day').startOf('day').add(4, 'hour')
            : today4AM;

          orderBy = [{ postLikes: { _count: 'desc' } }, { createdAt: 'desc' }];
          postLikesWhere = {
            createdAt: {
              gte: filterDate.toDate(),
            },
          };
          break;
        case SortEnum.DESC:
          orderBy = { createdAt: 'desc' };
          break;
      }

      const posts = await this.prisma.post.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        select: {
          id: true,
          address: true,
          latitude: true,
          longitude: true,
          user: true,
          postLikes: {
            where: postLikesWhere,
          },
          postFiles: {
            select: { file: { select: { filePath: true } } },
          },
        },
      });

      const responsePosts = posts.map((post) => this.getPostResponse(post));

      return responsePosts;
    }
  }

  async getPost(postId: number): Promise<PostEntryResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        id: true,
        user: true,
        address: true,
        latitude: true,
        longitude: true,
        postLikes: true,
        postFiles: {
          select: { file: { select: { filePath: true } } },
        },
      },
    });

    return this.getPostResponse(post);
  }

  async deletePost(userId: number, postId: number) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
        deletedAt: null,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException(
        '본인이 작성한 게시글만 삭제할 수 있습니다.',
      );
    }

    await this.prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
