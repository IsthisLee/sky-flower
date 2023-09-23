import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { PostEntryResponseDto } from 'src/api/posts/dtos/post-entry-responst.dto';
import { PageAdditionalResponseDto } from 'src/common/dtos/pagination.dto';

@ApiExtraModels(PostEntryResponseDto)
export class PostListResponseDto extends PageAdditionalResponseDto {
  @ApiProperty({
    description: '게시글 목록',
    type: PostEntryResponseDto,
    isArray: true,
  })
  list: PostEntryResponseDto[];
}
