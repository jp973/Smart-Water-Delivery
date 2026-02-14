import { config } from "../../../config/v1/config";

interface PaymentS3Services {
  uploadToS3?: (fileName: string, data: Buffer) => Promise<unknown>;
  deleteFromS3?: (fileName: string) => Promise<unknown>;
  getSignedUrl?: (fileName: string) => Promise<string>;
  getNextFileNumber?: (fileName: string) => Promise<string>;
  getPresignedPost?: (fileName: string) => Promise<unknown>;
  getImageDataUri?: (fileName: string) => Promise<unknown>;
  getMultiplePresignedPosts?: (fileNames: string[]) => Promise<string[]>;
}

export async function getStorageServices(): Promise<PaymentS3Services | false> {
  const storageService = config.STORAGE_SERVICE;

  if (storageService === "S3") {
    const s3Services = await import("./s3Services");
    return {
      uploadToS3: s3Services.uploadToS3,
      deleteFromS3: s3Services.deleteFromS3,
      getSignedUrl: s3Services.getSignedUrl,
      getNextFileNumber: s3Services.getNextFileNumber,
      getPresignedPost: s3Services.getPresignedPost,
      getImageDataUri: s3Services.getImageDataUri,
      getMultiplePresignedPosts: undefined, // Not implemented yet
    };
  } else {
    return false;
  }
}
