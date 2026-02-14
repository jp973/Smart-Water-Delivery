import {
    S3,
    GetObjectCommand,
    HeadObjectCommand,
    DeleteObjectCommand,
    PutObjectCommand,
    ListObjectsV2Command,
  } from "@aws-sdk/client-s3";
  import { getSignedUrl as getPresignedUrl } from "@aws-sdk/s3-request-presigner";
  import { config } from "../../../config/v1/config";
  import { logger } from "../../../utils/v1/logger";
  
  const S3_CONFIG = {
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
    region: config.S3_REGION,
  };
  
  const s3Client = new S3(S3_CONFIG);
  const S3_BUCKET_NAME = config.S3_BUCKET;
  
  export async function uploadToS3(fileName: string, data: Buffer) {
    const putObjectCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: fileName,
      Body: data,
    });
    await s3Client.send(putObjectCommand);
  }
  
  export async function deleteFromS3(fileName: string): Promise<boolean> {
    try {
      const headObjectCommand = new HeadObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: fileName,
      });
  
      await s3Client.send(headObjectCommand);
  
      const deleteObjectCommand = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: fileName,
      });
  
      await s3Client.send(deleteObjectCommand);
  
      logger.info("Successfully deleted image.");
      return true;
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        (error as { name?: string }).name === "NotFound"
      ) {
        logger.error({ data: error }, "File not found in S3:");
        throw error;
      } else {
        logger.error({ data: error }, "Error deleting from S3:");
        throw error;
      }
    }
  }
  
  export async function getSignedUrl(fileName: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: fileName,
    });
  
    const signedUrl = await getPresignedUrl(s3Client, command, {
      expiresIn: Number(config.SIGNEDURL_EXPIRY) * 60 * 60,
    });
    return signedUrl;
  }
  
  export async function getImageDataUri(fileName: string): Promise<string | null> {
    try {
      const getObjectCommand = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: fileName,
      });
  
      const response = await s3Client.send(getObjectCommand);
  
      if (!response.Body) {
        logger.error("No body returned from S3");
        return null;
      }
  
      const chunks: Buffer[] = [];
      const stream = response.Body as NodeJS.ReadableStream;
      for await (const chunk of stream) {
        chunks.push(chunk as Buffer);
      }
      const buffer = Buffer.concat(chunks);
  
      const ext = fileName.split(".").pop()?.toLowerCase();
      let mimeType = "application/octet-stream";
      if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
      else if (ext === "png") mimeType = "image/png";
      else if (ext === "gif") mimeType = "image/gif";
      else if (ext === "webp") mimeType = "image/webp";
  
      const base64 = buffer.toString("base64");
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      logger.error({ data: error }, "Error fetching image from S3:");
      return null;
    }
  }
  
  export async function getPresignedPost(fileName: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: fileName,
    });
  
    const signedUrl = await getPresignedUrl(s3Client, command, {
      expiresIn: Number(config.SIGNEDURL_EXPIRY) || 3600,
    });
  
    return signedUrl;
  }
  
  export async function getNextFileNumber(fileName: string) {
    try {
      const baseFileName = fileName.split(".").slice(0, -1).join(".");
      const fileExtension = fileName.split(".").pop();
      const params = {
        Bucket: S3_BUCKET_NAME,
        Prefix: baseFileName,
      };
  
      const listObjectsCommand = new ListObjectsV2Command(params);
      const data = await s3Client.send(listObjectsCommand);
  
      if (data?.Contents && data.Contents.length > 0) {
        const existingFiles = data.Contents.map((item: { Key?: string }) => item.Key || "").filter(Boolean);
  
        const existingNumbers = existingFiles
          .map((file: string) => {
            const match = file.match(new RegExp(`${baseFileName}-(\\d+)\\.${fileExtension}$`));
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter((num: number) => num !== null && num !== 0);
  
        const originalExists = existingFiles.includes(fileName);
  
        if (originalExists) {
          const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
          return `${baseFileName}-${maxNumber + 1}.${fileExtension}`;
        } else {
          return fileName;
        }
      } else {
        return fileName;
      }
    } catch (error) {
      logger.error({ data: error }, "Error getting next file number:");
      return null;
    }
  }
  