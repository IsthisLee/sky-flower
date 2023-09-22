import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import mime from 'mime-types';
import { ConfigService } from '@nestjs/config';
import { GeneratorService } from '../../shared/services/generator.service';
import {
  GeneratePutPresignedUrlDto,
  GeneratePutPresignedUrlOutputDto,
} from './dtos/generate-put-presigned-url.dto';

@Injectable()
export class S3Service {
  private readonly logger = new Logger('AwsS3Service');
  private readonly s3Client: S3Client;

  constructor(
    public configService: ConfigService,
    public generatorService: GeneratorService,
  ) {
    this.s3Client = new S3Client({
      region: configService.get<string>('AWS_S3_BUCKET_REGION'),
      credentials: {
        accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async generatePutObjectSignedUrl({
    originalFileName,
    fileExtension,
    contentLength,
  }: GeneratePutPresignedUrlDto): Promise<GeneratePutPresignedUrlOutputDto> {
    const fileContentType = <string>mime.contentType(fileExtension);

    const fileName = this.generatorService.fileName(
      originalFileName,
      <string>mime.extension(fileContentType),
    );

    const key = 'images/' + fileName;
    const command = new PutObjectCommand({
      Bucket: this.configService.get<string>('AWS_S3_BUCKET_NAME'),
      Key: key,
      ContentType: fileContentType,
      ContentLength: contentLength,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    }).catch((err) => {
      this.logger.error(err);
      throw new InternalServerErrorException('S3 signed url 생성 실패');
    });

    return { signedUrl, fileName };
  }
}
