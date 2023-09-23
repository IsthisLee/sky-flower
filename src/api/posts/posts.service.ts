import { FileInfoSaveService } from '../../shared/services/file-info-save.service';
import {
  BadRequestException,
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
import { PageResponse } from 'src/common/interface';

const postSelect = {
  id: true,
  user: {
    select: {
      id: true,
      nickname: true,
      profileImage: { select: { filePath: true } },
    },
  },
  address: true,
  latitude: true,
  longitude: true,
  postLikes: true,
  postFiles: {
    select: { file: { select: { filePath: true } } },
  },
};
type PostType = Prisma.PostGetPayload<{ select: typeof postSelect }>;

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

  private getPostResponse(
    post: PostType,
    visitUserId: number,
  ): PostEntryResponseDto {
    return {
      id: post.id,
      userId: post.user.id,
      userNickname: post.user.nickname,
      userProfileUrl: post.user.profileImage?.filePath,
      address: post.address,
      latitude: post.latitude,
      longitude: post.longitude,
      photoUrl: post.postFiles[0].file.filePath,
      likeCount: post.postLikes.length,
      isLiked: post.postLikes.some(
        (postLike) => visitUserId === postLike.userId,
      ),
    };
  }

  private async getPostsResponse({
    posts,
    visitUserId,
    page,
    limit,
  }: {
    posts: PostType[];
    visitUserId: number;
    page: number;
    limit: number;
  }): Promise<PageResponse<PostEntryResponseDto[]>> {
    const totalCount = await this.prisma.post.count();
    const paginationData = this.generatePaginationData({
      page,
      limit,
      totalCount,
      currentElementsCount: posts.length,
    });
    const responsePosts = posts.map((post) =>
      this.getPostResponse(post, visitUserId),
    );

    return {
      ...paginationData,
      list: responsePosts,
    };
  }

  private generatePaginationData({
    page,
    limit,
    totalCount,
    currentElementsCount,
  }: {
    page: number;
    limit: number;
    totalCount: number;
    currentElementsCount: number;
  }): Omit<PageResponse<PostEntryResponseDto>, 'list'> {
    const totalPages = Math.ceil(totalCount / limit);

    return {
      first: page === 1,
      last: page * limit >= totalCount,
      currentElements: currentElementsCount,
      size: limit,
      totalElements: totalCount,
      totalPages: totalPages,
      currentPage: page,
    };
  }

  async getPosts(
    getPostsQuery: GetPostsQueryDto,
  ): Promise<PageResponse<PostEntryResponseDto[]>> {
    const { page, limit, sort, userLatitude, userLongitude } = getPostsQuery;

    if (sort === SortEnum.DISTANCE || sort === SortEnum.LIKE) {
      let query: string;

      switch (sort) {
        case SortEnum.DISTANCE:
          // 정렬 기준: 거리순 -> 최신순
          query = `SELECT id, earth_distance(
            ll_to_earth(${userLatitude}, ${userLongitude}),
            ll_to_earth("latitude", "longitude")
            ) as distance
            FROM "skyflower"."Post"
            ORDER BY distance ASC, "Post".created_at DESC
            LIMIT ${limit} OFFSET ${(page - 1) * limit}
          `;
          break;

        case SortEnum.LIKE:
          // 매일 04시 이후부터 당일 누적 좋아요 개수 기준(04시 이전은 전날 누적 좋아요 개수 기준)
          // 정렬 기준: 좋아요 -> 최신순 -> 거리순
          const now = dayjs();
          const today4AM = dayjs().startOf('day').add(4, 'hour');

          let startDate: dayjs.Dayjs;
          let endDate: dayjs.Dayjs;

          if (now.isAfter(today4AM)) {
            startDate = dayjs().startOf('day');
            endDate = dayjs().endOf('day');
          } else {
            startDate = dayjs().subtract(1, 'day').startOf('day');
            endDate = dayjs().subtract(1, 'day').endOf('day');
          }

          query = `
            SELECT 
                id, 
                COUNT(
                    CASE 
                        WHEN "PostLike".created_at BETWEEN '${startDate
                          .toDate()
                          .toISOString()}' AND '${endDate
            .toDate()
            .toISOString()}' THEN 1 
                        ELSE NULL 
                    END
                ) as todayLikeCount
                ${
                  userLatitude && userLongitude
                    ? `,earth_distance(
                ll_to_earth(${userLatitude}, ${userLongitude}),
                ll_to_earth("latitude", "longitude")
                ) as distance`
                    : ''
                }
            FROM "Post"
            LEFT JOIN "PostLike" ON "Post".id = "PostLike".post_id
            GROUP BY "Post".id
            ORDER BY todayLikeCount DESC, ${
              userLatitude && userLongitude ? 'distance ASC, ' : ''
            }"Post".created_at DESC
            LIMIT ${limit} OFFSET ${(page - 1) * limit}
          `;
          break;
      }

      const postIdList: (
        | { id: number; distance: number }
        | { id: number; todayLikeCount: bigint }
      )[] = await this.prisma.$queryRawUnsafe(query);

      const posts = await this.prisma.post.findMany({
        where: {
          id: { in: postIdList.map((likeRankPost) => likeRankPost.id) },
        },
        select: postSelect,
      });

      const reOrderedPost = postIdList
        .map((likeRankPost) => {
          return posts.find((post) => post.id === likeRankPost.id);
        })
        .filter(Boolean);

      return await this.getPostsResponse({
        posts: reOrderedPost,
        visitUserId: 0,
        page,
        limit,
      });
    } else {
      let orderBy:
        | Prisma.PostOrderByWithRelationInput
        | Prisma.PostOrderByWithRelationInput[];

      switch (sort) {
        case SortEnum.DESC:
          orderBy = { createdAt: 'desc' };
          break;

        default:
          throw new BadRequestException('잘못된 정렬 기준입니다.');
      }

      const posts = await this.prisma.post.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        select: postSelect,
      });

      return await this.getPostsResponse({
        posts,
        visitUserId: 0,
        page,
        limit,
      });
    }
  }

  async getPost(postId: number): Promise<PostEntryResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: postSelect,
    });

    return this.getPostResponse(post, 0);
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
