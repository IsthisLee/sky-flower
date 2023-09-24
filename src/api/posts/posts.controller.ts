import { AuthGuard } from '@nestjs/passport';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { GetPostsQueryDto } from './dtos/get-posts.dto';
import { CreatePostDto } from './dtos/create-post.dto';
import { JwtUserPayload } from 'src/common/decorators/jwt-user.decorator';
import { JwtPayloadInfo, PageResponse } from 'src/common/interface';
import { PostEntryResponseDto } from './dtos/post-entry-responst.dto';
import { PostListResponseDto } from './dtos/posts-response.dto';
import { Post as PostModel } from '@prisma/client';
import { OnlyGetAccessTokenValueGuard } from '../auth/security/guards/only-get-access-token-value.guard';

@Controller('posts')
@ApiTags('Posts - 게시글')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt-access'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '게시글 생성 API',
  })
  @ApiCreatedResponse({ description: '게시글 생성 성공' })
  async createPost(
    @JwtUserPayload() user: JwtPayloadInfo,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostModel> {
    return this.postsService.createPost(user.userId, createPostDto);
  }

  @Get()
  @UseGuards(OnlyGetAccessTokenValueGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '게시글 목록 조회 API',
  })
  @ApiExtraModels(PostListResponseDto)
  @ApiOkResponse({
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            data: {
              type: 'array',
              items: {
                $ref: getSchemaPath(PostListResponseDto),
              },
            },
          },
        },
      },
    },
  })
  async getPosts(
    @JwtUserPayload() jwtUser: JwtPayloadInfo,
    @Query() getPostsQuery: GetPostsQueryDto,
  ): Promise<PageResponse<PostEntryResponseDto[]>> {
    return this.postsService.getPosts(jwtUser.userId, getPostsQuery);
  }

  @Get('/:postId')
  @UseGuards(OnlyGetAccessTokenValueGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '게시글 상세조회 API',
  })
  @ApiExtraModels(PostEntryResponseDto)
  @ApiOkResponse({
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            data: {
              $ref: getSchemaPath(PostEntryResponseDto),
            },
          },
        },
      },
    },
  })
  async getPost(
    @JwtUserPayload() jwtUser: JwtPayloadInfo,
    @Query('postId', new ParseIntPipe()) postId: number,
  ): Promise<PostEntryResponseDto> {
    return this.postsService.getPost(jwtUser.userId, postId);
  }

  @Delete('/:postId')
  @UseGuards(AuthGuard('jwt-access'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '게시글 삭제 API',
  })
  @ApiOkResponse({ description: '게시글 삭제 성공' })
  @ApiNotFoundResponse({ description: '게시글 없음' })
  @ApiForbiddenResponse({ description: '권한 없음' })
  async deletePost(
    @JwtUserPayload() user: JwtPayloadInfo,
    @Param('postId', new ParseIntPipe()) postId: number,
  ) {
    return this.postsService.deletePost(user.userId, postId);
  }

  @Post('/:postId/like')
  @UseGuards(AuthGuard('jwt-access'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '게시글 좋아요 API',
  })
  @ApiCreatedResponse({ description: '게시글 좋아요 성공' })
  @ApiNotFoundResponse({ description: '게시글 없음' })
  @ApiForbiddenResponse({ description: '권한 없음' })
  async likePost(
    @JwtUserPayload() user: JwtPayloadInfo,
    @Param('postId', new ParseIntPipe()) postId: number,
  ) {
    return this.postsService.likePost(user.userId, postId);
  }

  @Delete('/:postId/like')
  @UseGuards(AuthGuard('jwt-access'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '게시글 좋아요 취소 API',
  })
  @ApiOkResponse({ description: '게시글 좋아요 취소 성공' })
  @ApiNotFoundResponse({ description: '게시글 없음' })
  @ApiForbiddenResponse({ description: '권한 없음' })
  async unlikePost(
    @JwtUserPayload() user: JwtPayloadInfo,
    @Param('postId', new ParseIntPipe()) postId: number,
  ) {
    return this.postsService.unlikePost(user.userId, postId);
  }
}
