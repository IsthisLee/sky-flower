import { registerDecorator, type ValidationOptions } from 'class-validator';

export function IsValidFilePath(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object, propertyName: string) => {
    registerDecorator({
      propertyName: propertyName,
      name: 'isValidFilePath',
      target: object.constructor,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string) {
          const S3Region = process.env.AWS_S3_BUCKET_REGION;
          const regex = new RegExp(
            `^https:\/\/[a-zA-Z0-9-]+\.s3\.${S3Region}\.amazonaws\.com\/images\/[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.[a-f0-9-]{36}\.[a-zA-Z0-9]+$`,
          );
          return regex.test(value);
        },
        defaultMessage() {
          return 'filePath는 SkyFlower 서비스에서 업로드한 S3 URL 형식이어야 합니다.';
        },
      },
    });
  };
}
