import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 Configuration
const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET = process.env.AWS_S3_BUCKET || 'mna-meeting-notes';

// Create S3 client
function createS3Client(): S3Client {
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
  }

  return new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Upload a file to S3
 * @param fileBuffer - The file content as a Buffer or Uint8Array
 * @param key - The S3 object key (path)
 * @param contentType - The MIME type of the file
 * @returns The S3 object key
 */
export async function uploadFile(
  fileBuffer: Buffer | Uint8Array,
  key: string,
  contentType: string
): Promise<string> {
  const s3Client = createS3Client();

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return key;
}

/**
 * Delete a file from S3
 * @param key - The S3 object key (path)
 */
export async function deleteFile(key: string): Promise<void> {
  const s3Client = createS3Client();

  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generate a pre-signed URL for accessing a file
 * @param key - The S3 object key (path)
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @param fileName - Optional original file name to force download with that name
 * @returns The pre-signed URL
 */
export async function getSignedUrl(
  key: string,
  expiresIn: number = 3600,
  fileName?: string
): Promise<string> {
  const s3Client = createS3Client();

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ResponseContentDisposition: fileName ? `attachment; filename="${fileName}"` : undefined,
  });

  return awsGetSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a pre-signed URL for uploading a file
 * @param key - The S3 object key (path)
 * @param contentType - The MIME type of the file
 * @param expiresIn - URL expiration time in seconds (default: 15 minutes)
 * @returns The pre-signed URL
 */
export async function getUploadSignedUrl(
  key: string,
  contentType: string,
  expiresIn: number = 900
): Promise<string> {
  const s3Client = createS3Client();

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return awsGetSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Download a file from S3
 * @param key - The S3 object key (path)
 * @returns The file content as a Buffer
 */
export async function downloadFile(key: string): Promise<Buffer> {
  const s3Client = createS3Client();

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  const response = await s3Client.send(command);
  const stream = response.Body as Readable;

  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Generate a unique S3 key for a meeting note file
 * @param fileName - The original file name
 * @returns A unique S3 key
 */
export function generateMeetingNoteKey(fileName: string): string {
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  // Sanitize file name and create key
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `meeting-notes/${uuid}_${timestamp}_${sanitizedFileName}`;
}
