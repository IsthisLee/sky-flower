import { Injectable } from '@nestjs/common';
import { v1 as uuid } from 'uuid';

@Injectable()
export class GeneratorService {
  public uuid(): string {
    return uuid();
  }

  public fileName(originalFileName: string, ext: string): string {
    return originalFileName + '.' + this.uuid() + '.' + ext;
  }
}
