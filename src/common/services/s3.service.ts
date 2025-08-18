import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private s3: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName =
      this.configService.get<string>('AWS_S3_BUCKET_NAME') || 'proposia-pdfs';
    const endpoint =
      this.configService.get<string>('AWS_S3_ENDPOINT') ||
      'http://localhost:4566';
    const region =
      this.configService.get<string>('AWS_S3_REGION') || 'us-east-1';
    const accessKeyId =
      this.configService.get<string>('AWS_ACCESS_KEY_ID') || 'test';
    const secretAccessKey =
      this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || 'test';

    this.s3 = new S3Client({
      region: region,
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    try {
      await this.s3.send(command);
      return `${this.configService.get<string>('AWS_S3_ENDPOINT') || 'http://localhost:4566'}/${this.bucketName}/${key}`;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw error;
    }
  }
}
