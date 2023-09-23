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
import { JwtPayloadInfo } from 'src/common/interface';
import { PostEntryResponseDto } from './dtos/post-entry-responst.dto';

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
  async createPost(
    @JwtUserPayload() user: JwtPayloadInfo,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.createPost(user.userId, createPostDto);
  }

  @Get()
  @ApiOperation({
    summary: '게시글 목록 조회 API',
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
              type: 'array',
              items: {
                $ref: getSchemaPath(PostEntryResponseDto),
              },
            },
          },
        },
      },
    },
  })
  async getPosts(
    @Query() getPostsQuery: GetPostsQueryDto,
  ): Promise<PostEntryResponseDto[]> {
    return this.postsService.getPosts(getPostsQuery);
  }

  @Get('/:postId')
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
    @Query('postId', new ParseIntPipe()) postId: number,
  ): Promise<PostEntryResponseDto> {
    return this.postsService.getPost(postId);
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
}
