import { Injectable } from '@nestjs/common';
import { FileType } from '@prisma/client';
import { v1 as uuid } from 'uuid';

@Injectable()
export class GeneratorService {
  public uuid(): string {
    return uuid();
  }

  public fileName(originalName: string, ext: string): string {
    return originalName + '.' + this.uuid() + '.' + ext;
  }

  private fileTypeByExt(ext: string): FileType {
    switch (ext) {
      case 'jpeg':
      case 'jpg':
      case 'png':
        return FileType.image;
      case 'mp4':
      case 'mov':
        return FileType.video;
      default:
        return FileType.other;
    }
  }

  private fileInfoByFileName(fileName: string): {
    originalName: string;
    fileType: FileType;
    ext: string;
  } {
    const splitFileName = fileName.split('.');

    return {
      originalName: splitFileName[0],
      fileType: this.fileTypeByExt(splitFileName[splitFileName.length - 1]),
      ext: splitFileName[splitFileName.length - 1],
    };
  }

  public fileInfoByFilePath(filePath: string): {
    originalName: string;
    fileType: FileType;
    ext: string;
  } {
    const splitFilePath = filePath.split('/');

    return this.fileInfoByFileName(splitFilePath[splitFilePath.length - 1]);
  }
}
