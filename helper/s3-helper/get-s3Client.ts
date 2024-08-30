import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import path from "path";
import { sendMyIPRFileUploadedWebhook } from "../myipr-helper/send-myipr-file-uploaded-webhook";
import { Readable } from "typeorm/platform/PlatformTools";
import { Upload } from "@aws-sdk/lib-storage";
import crypto from'crypto';

const baseDir = "s3";
const maxSize = 5.5 * 1000 * 1000 * 1000

const s3 = new S3Client({
  region: process.env.AWS_REGION, // Specify your AWS region
  credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
});

export class s3HrlperService {
  private sendFileUploadWebhook = new sendMyIPRFileUploadedWebhook()

  public getS3Client(input: any): S3Client {
    try {
      // validate incoming input
      this.validates3ClientInput(input);

      // Set up S3 client with provided credentials and region
      const s3Client = new S3Client({
        region: input.region,
        credentials: {
          accessKeyId: input.accessKeyId,
          secretAccessKey: input.secretAccessKey,
        },
      });
      return s3Client;
    } catch (error) {
      throw error;
    }
  }

  public validates3ClientInput(input: any) {
    const accessKeyId = input.accessKeyId;
    const secretAccessKey = input.secretAccessKey;
    const region = input.region;
    const bucketName = input.bucketName;

    if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
      throw "Plese make sure you've provided all S3 credentials input.";
    }
  }

  public async listAllFilesInBucket(s3Client: S3Client, bucketName: string) {
    try {
      // Attempt to list buckets
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
      });
      const result = await s3Client.send(command);
      return result;
    } catch (error) {
      throw error;
    }
  }

  public async getFileMetadata(
    s3Client: S3Client,
    bucketName: string,
    keyName: string
  ) {
    try {
      // Attempt to list buckets
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: keyName,
      });
      console.log("🚀 ~ file: get-s3Client.ts:83 ~ s3HrlperService ~ command:", command)
      const result = await s3Client.send(command);
      return result;
    } catch (error) {
      throw error;
    }
  }

  public async getFileFromS3(
    s3Client: S3Client,
    bucketName: string,
    keyName: string,
    userId: string,
  ) {
    try {

      const metaDataCommand = new HeadObjectCommand({
        Bucket: bucketName, // Replace with your S3 bucket name
        Key: keyName,
      })

      const metaData = await s3Client.send(metaDataCommand);
      console.log("🚀 ~ file: get-s3Client.ts:94 ~ s3HrlperService ~ metaData:", metaData)

      let sizeInKB = 0;
      if (metaData.ContentLength) {
        sizeInKB = Math.ceil(metaData.ContentLength / 1024);
        console.log("🚀 ~ file: get-s3Client.ts:117 ~ s3HrlperService ~ downloadFile ~ sizeInKB:", sizeInKB)
      }

      if(sizeInKB > maxSize) {
          throw new Error('File size exceed the allowed size of 5GB')
      }

      const fileName = Date.now() + "_s3_" + metaData.$metadata.requestId + path.extname(keyName);
      const downloadPath = path.join(`${userId}/${baseDir}/`, fileName);

      this.downloadFile(s3Client, bucketName, keyName, sizeInKB, downloadPath)

      return { path: downloadPath, size: `${sizeInKB}` };

      // Attempt to list buckets
    } catch (error) {
      console.log("🚀 ~ file: get-s3Client.ts:123 ~ s3HrlperService ~ error:", error)
      throw error;
    }
  }

  async downloadFile(s3Client: S3Client, bucketName: string, keyName: string, sizeInKB: number, downloadPath: string) {
    try{
      const params = {
        Bucket: bucketName, // Replace with your S3 bucket name
        Key: keyName,
      };
  
      const s3Stream = new Readable({
        async read() {
          try {
            const { Body } = await s3Client.send(new GetObjectCommand(params));
            this.push(await Body?.transformToByteArray());
            this.push(null); // Signal the end of the stream
          } catch (err) {
            this.emit('error', err);
          }
        },
      });

      let sha256: string = ''

      const hash = crypto.createHash('sha256');
      s3Stream.on('data', (data) => {
        hash.update(data);
      });
      s3Stream.on('end', () => {
        sha256 = hash.digest('hex');
        console.log(null, sha256);
      });
      s3Stream.on('error', (error) => {
        console.log(error);
      });

      const target = {
          Bucket: process.env.AWS_PUBLIC_BUCKET_NAME,
          Key: downloadPath,
          Body: s3Stream, // Use the stream directly
          ChecksumAlgorithm: 'SHA256'
      };
      try {
          const parallelUploads3 = new Upload({
          client: new S3Client({}),
          params: target,
          });

          parallelUploads3.on("httpUploadProgress", (progress) => {
              console.log(progress?.part);
          });

          await parallelUploads3.done();
      } catch (e) {
          throw(e);
      }

      try {
          await this.sendFileUploadWebhook.sendMyIPRFileUploadedWebhook(downloadPath, sha256);
      } catch (error: any) {
          console.error("Error sending webhook:", JSON.stringify(error));
      }
    } catch(error) {
      throw error;
    }
  }
}
