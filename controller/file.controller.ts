import { Request, Response } from 'express';
import { failureResponse, successResponse } from "../response/service";
import multer from 'multer';
import multers3 from 'multer-s3'
import { ArchiveFile } from '../helper/file/archive-file';
import archiver from 'archiver';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
    region: process.env.AWS_REGION, // Specify your AWS region
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    },
});

const s3Storage = multers3(
    {
        s3: s3,
        bucket: process.env.AWS_PUBLIC_BUCKET_NAME ?? '',
        contentType: multers3.AUTO_CONTENT_TYPE,
        key: (req: Request, file, cb) => {
            const userId = req.query.user_id
            cb(null, `${userId}/local/${Date.now().toString()}-${file.originalname}`);
        },
    }
)

// Initialize multer upload
const upload = multer({ storage: s3Storage });

export class FileController {
    private archiveFile = new ArchiveFile()

    public async unlinkFile(req: Request, res: Response) {
        try {
            const fileName = req.body.file_name;
            if(!fileName) {
                throw new Error('File name is required');   
            }
            
            const awsRes = await s3.send(new DeleteObjectCommand({
                Bucket: process.env.AWS_PUBLIC_BUCKET_NAME,
                Key: fileName
            }))
            console.log("🚀 ~ file: file.controller.ts:48 ~ FileController ~ unlinkFile ~ awsRes:", awsRes)

            successResponse('success', {}, res, req)
        } catch (error: any) {
            failureResponse(error.message, error, res, req);
        }
    }

    public async archiveFileAndReload(req: Request, res: Response) {
        try {
            const userFileName = req.body.user_file_name
            const fileName = req.body.file_name
            const provider = req.body.provider;
            const accessToken = req.body.access_token;

            if(!userFileName || !fileName || !provider || !accessToken) {
                throw new Error('Missing required values')
            }

            const archStatus = await this.archiveFile.archiveFile(userFileName, fileName, provider, accessToken)
            res.status(200).json({ message: archStatus, file: req.file });
        } catch(err) {
            throw err
        }
    }

    public async saveFile(req: Request, res: Response) {
        const userId = req.query.user_id;
        if(!userId) {
            failureResponse('UserID query param is required', null, res, req);
        } else {
            upload.single('file')(req, res, (err) => {
                if (err) {
                  return res.status(400).json({ message: 'File upload failed', error: err.message });
                }
            
                if (!req.file) {
                  return res.status(400).json({ message: 'No file uploaded' });
                }
                
                // File upload successful
                res.status(200).json({ message: 'File uploaded successfully', file: req.file });
            });
        }
    }
}