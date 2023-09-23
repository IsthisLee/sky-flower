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
import { Post, PostFileUsage, Prisma } from '@prisma/client';
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
      deletedAt: true,
    },
  },
  address: true,
  latitude: true,
  longitude: true,
  postLikes: {
    where: { deletedAt: null },
    select: {
      userId: true,
    },
  },
  postFiles: {
    where: { deletedAt: null, file: { deletedAt: null } },
    select: {
      usage: true,
      file: { select: { filePath: true } },
    },
  },
};
type PostType = Prisma.PostGetPayload<{ select: typeof postSelect }>;

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileInfoSaveService: FileInfoSaveService,
  ) {}

  async createPost(
    userId: number,
    createPostDto: CreatePostDto,
  ): Promise<Post> {
    const {
      photoUrl,
      markerPhotoUrl,
      latitude,
      longitude,
      address,
      cityName,
      districtName,
      townName,
    } = createPostDto;

    const newPost = await this.prisma.$transaction(async (tx) => {
      // save file info
      const [savedFileInfo, savedMarkerFileInfo] = await Promise.all([
        this.fileInfoSaveService.saveFile(tx, userId, photoUrl),
        this.fileInfoSaveService.saveFile(tx, userId, markerPhotoUrl),
      ]);

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
      await tx.postFile.createMany({
        data: [
          {
            postId: newPost.id,
            fileId: savedFileInfo.id,
            usage: PostFileUsage.post_photo,
          },
          {
            postId: newPost.id,
            fileId: savedMarkerFileInfo.id,
            usage: PostFileUsage.map_marker,
          },
        ],
      });

      return newPost;
    });

    return newPost;
  }

  private getPostResponse(
    post: PostType,
    visitUserId?: number,
  ): PostEntryResponseDto {
    return {
      id: post.id,
      userId: post.user.id,
      userNickname: post.user.nickname,
      userProfileUrl: post.user.profileImage?.filePath,
      isDeletedUser: !!post.user.deletedAt,
      address: post.address,
      latitude: post.latitude,
      longitude: post.longitude,
      photoUrl: post.postFiles.find(
        (postFile) => postFile.usage === PostFileUsage.post_photo,
      )?.file.filePath,
      markerPhotoUrl: post.postFiles.find(
        (postFile) => postFile.usage === PostFileUsage.map_marker,
      )?.file.filePath,
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
    visitUserId?: number;
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
    userId: number,
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
          // 정렬 기준: 좋아요 -> 거리순 -> 최신순
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
                "Post".id, 
                COUNT(
                    CASE 
                        WHEN "PostLike".created_at BETWEEN '${startDate
                          .toDate()
                          .toISOString()}' AND '${endDate
            .toDate()
            .toISOString()}' AND "PostLike".deleted_at IS NULL THEN 1 
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
            WHERE "Post".deleted_at IS NULL
            GROUP BY "Post".id
            ORDER BY todayLikeCount DESC, ${
              userLatitude && userLongitude ? 'distance ASC, ' : ''
            }"Post".created_at DESC
            LIMIT ${limit} OFFSET ${(page - 1) * limit}
          `;
          break;
      }

      const postIdList = await this.prisma.$queryRawUnsafe<
        (
          | { id: number; distance: number }
          | { id: number; todayLikeCount: bigint }
        )[]
      >(query);

      console.log(postIdList);

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
        visitUserId: userId,
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
        visitUserId: userId,
        page,
        limit,
      });
    }
  }

  async getPost(userId: number, postId: number): Promise<PostEntryResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: postSelect,
    });

    return this.getPostResponse(post, userId);
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

  async likePost(userId: number, postId: number) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    const postLike = await this.prisma.postLike.findFirst({
      where: {
        postId,
        userId,
        deletedAt: null,
      },
    });

    if (postLike) {
      throw new BadRequestException('이미 좋아요를 누른 게시글입니다.');
    }

    await this.prisma.postLike.create({
      data: {
        postId,
        userId,
      },
    });
  }

  async unlikePost(userId: number, postId: number) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    const postLike = await this.prisma.postLike.findFirst({
      where: {
        postId,
        userId,
        deletedAt: null,
      },
    });

    if (!postLike) {
      throw new NotFoundException('좋아요를 누른 게시글이 아닙니다.');
    }

    await this.prisma.postLike.updateMany({
      where: {
        postId,
        userId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
