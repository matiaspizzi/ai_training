import { S3Client } from '@aws-sdk/client-s3';
import 'dotenv/config';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const BUCKET_NAME = process.env.S3_BUCKET_NAME || '';

export async function uploadBase64ImageToS3(base64Image: string): Promise<string> {
  try {
    const matches = base64Image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);

    if (!matches) {
      throw new Error("Base64 image string is not properly formatted.");
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    const extension = mimeType.split('/')[1];

    const buffer = Buffer.from(base64Data, 'base64');

    const key = `${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);
    console.log('Card image uploaded to S3: ', key);
    return key;
  } catch (err) {
    console.error("Error uploading image to S3: ", err);
    throw err;
  }
}

export async function deleteImageFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    console.log('Card image deleted from S3: ', key);
  } catch (error) {
    console.error("Error deleting image from S3: ", error);
  }
}