import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | null = null;

export function isS3Configured(): boolean {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID?.trim() &&
      process.env.AWS_SECRET_ACCESS_KEY?.trim() &&
      process.env.AWS_REGION?.trim() &&
      process.env.AWS_S3_BUCKET?.trim(),
  );
}

export function getS3Client(): S3Client {
  if (!isS3Configured()) {
    throw new Error("S3 is not configured");
  }
  if (!client) {
    client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

export function getS3Bucket(): string {
  const b = process.env.AWS_S3_BUCKET?.trim();
  if (!b) {
    throw new Error("AWS_S3_BUCKET is not set");
  }
  return b;
}

/** Stable object URL for persistence (bucket may still be private; use presigned URLs for access). */
export function publicObjectUrl(bucket: string, region: string, key: string): string {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
}

export async function putObject(params: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<void> {
  const bucket = getS3Bucket();
  const s3 = getS3Client();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );
}

export async function deleteObjectKey(key: string): Promise<void> {
  const bucket = getS3Bucket();
  const s3 = getS3Client();
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

export async function getDownloadSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
  const bucket = getS3Bucket();
  const s3 = getS3Client();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}
