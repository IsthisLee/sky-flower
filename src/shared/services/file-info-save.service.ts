import { BadRequestException, Injectable } from '@nestjs/common';
import { GeneratorService } from './generator.service';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class FileInfoSaveService {
  constructor(private readonly generatorService: GeneratorService) {}

  public async checkIsExistFile(prisma, fileUrl: string): Promise<boolean> {
    const isExistFile = await prisma.file.findUnique({
      where: { filePath: fileUrl },
    });

    return !!isExistFile;
  }

  public async saveFile(
    prisma: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
    userId: number,
    fileUrl: string,
  ) {
    // check exist file
    const isExistFile = await this.checkIsExistFile(prisma, fileUrl);
    if (isExistFile) {
      throw new BadRequestException('이미 존재하는 파일입니다.');
    }

    const { originalName, fileType, ext } =
      this.generatorService.fileInfoByFilePath(fileUrl);

    return await prisma.file.create({
      data: {
        userId: userId,
        originalFileName: originalName,
        fileType,
        fileExtension: ext,
        filePath: fileUrl,
      },
    });
  }
}
