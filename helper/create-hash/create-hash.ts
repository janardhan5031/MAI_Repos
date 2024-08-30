import crypto from'crypto';
import { Buffer } from 'node:buffer';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const s3 = new S3Client({
    region: process.env.AWS_REGION, // Specify your AWS region
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    },
});

export class CreateHash {
    public static async createFileHash(fileName: string) {
        try {
            const getObjectCommand = new GetObjectCommand({
                Bucket: process.env.AWS_PUBLIC_BUCKET_NAME,
                Key: fileName,
            });
          
            const getObjectOutput = await s3.send(getObjectCommand);
            const unitFile = await getObjectOutput.Body?.transformToByteArray();
            if(unitFile) {
                // Create a hash object
                const hash = crypto.createHash('sha256')
                
                hash.update(Buffer.from(unitFile));
                const fileHash = hash.digest('hex');
                console.log("🚀 ~ file: create-hash.ts:32 ~ CreateHash ~ createFileHash ~ hash:", fileHash)

                return fileHash
            }
              
            throw Error('Hashing error')
        } catch (error) {
            console.error(`Error in getFileHash: ${error}`);
            throw error;
        }
    }
}