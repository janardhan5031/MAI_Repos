import { google } from 'googleapis';
import crypto from'crypto';
import fs from 'fs';
import { sendMyIPRFileUploadedWebhook } from '../../helper/myipr-helper/send-myipr-file-uploaded-webhook';
import { ReadStream, Readable } from 'typeorm/platform/PlatformTools';
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import { CreateHash } from '../../helper/create-hash/create-hash';

let oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const scopes = [
    'https://www.googleapis.com/auth/drive.readonly'
];

const folderName = 'myipr'

const baseDir = '/app/downloads'
const maxSize = 5.5 * 1000 * 1000 * 1000

const s3 = new S3Client({
    region: process.env.AWS_REGION, // Specify your AWS region
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    },
});

export class GoogleDrive {
    private sendFileUploadWebhook = new sendMyIPRFileUploadedWebhook()

    async getAuthLink(userId: any) {
        try {
            const url = oauth2Client.generateAuthUrl({
                // 'online' (default) or 'offline' (gets refresh_token)
                access_type: 'offline',
                // If you only need one scope you can pass it as a string
                scope: scopes,
                state: userId, // this will be received back when the user is redirected after auth
              });
            return url;
        } catch(error) {
            throw error;
        }
    }

    async getAccessToken(code: string) {
        try {
            const {tokens} = await oauth2Client.getToken(code);
            return tokens;
        } catch(error) {
            throw error;
        }
    }

    async getFilesList(accessToken: string, query: string | undefined) {
        try {
            oauth2Client.setCredentials({"access_token": accessToken});
                const drive = google.drive({
                    version: 'v3',
                    auth: oauth2Client,
                });
                // await drive.about.get()
                
            const ingoreMimeTypes = `not mimeType contains 'application/vnd.google-apps' 
            and not mimeType contains 'android.package-archive'
            and not mimeType contains 'octet-stream'`;

            const queryString = query != undefined ? `name contains '${query}'` + ' and ' + ingoreMimeTypes : ingoreMimeTypes; 

            return (await drive.files.list({
                q: `trashed = false and ${queryString}`, 
                includeItemsFromAllDrives: false,
                
            })).data.files; 
        } catch(error) {
            throw error;
        }
    }

    async getFileDetails(accessToken: string, fileId: string) {
        try {
            oauth2Client.setCredentials({"access_token": accessToken});

            const drive = google.drive({
                version: 'v3',
                auth: oauth2Client
            });

            const fileDetails = await drive.files.get({
                fileId: fileId,
                fields: 'id, name, mimeType, size, sha256Checksum, webContentLink'
            });

            if(fileDetails.data.size && parseInt(fileDetails.data.size) > maxSize) {
                throw new Error('File size exceed the allowed size of 5gb')
            }

            return fileDetails.data;
        } catch (error) {
            throw error
        } 
    } 

    async getFile(accessToken: string, fileId: string, sizeInKB: number, fileName: string) {
        try {
            oauth2Client.setCredentials({"access_token": accessToken});
 
            const drive = google.drive({
                version: 'v3',
                auth: oauth2Client
            });

            const googleDriveResponse = await drive.files.get(
                { fileId: fileId, alt: 'media' }, 
                { responseType: 'stream' }
            );

            let sha256: string = '';
            
            if(process.env.AWS_PUBLIC_BUCKET_NAME) {
                const hash = crypto.createHash('sha256');
                googleDriveResponse.data.on('data', (data) => {
                        hash.update(data);
                    });
                    googleDriveResponse.data.on('end', () => {
                        sha256 = hash.digest('hex');
                        console.log(null, sha256);
                    });
                    googleDriveResponse.data.on('error', (error) => {
                        console.log(error);
                    });

                const target = {
                    Bucket: process.env.AWS_PUBLIC_BUCKET_NAME,
                    Key: fileName,
                    Body: googleDriveResponse.data as Readable, // Use the stream directly
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
                    await this.sendFileUploadWebhook.sendMyIPRFileUploadedWebhook(fileName, sha256);
                } catch (error: any) {
                    console.error("Error sending webhook:", JSON.stringify(error));
                }
            } else {
                throw new Error('Bucket name not configured')
            }
            
            return fileName;
        } catch (error) {
            throw error;
        }
    }

    async getMyiprFolder(drive: any, queryString: string) {
        try {
            return (await drive.files.list({
                q: queryString, 
                includeItemsFromAllDrives: false
            })).data.files;
        } catch(error) {
            throw error
        }
    }

    async uploadMyiprArchive(accessToken: string, fileName: string, filePath: string) {
        try {
            oauth2Client.setCredentials({"access_token": accessToken});

            const drive = google.drive({
                version: 'v3',
                auth: oauth2Client
            });

            const queryString = `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`

            let folderId;

            const folderResult = await this.getMyiprFolder(drive, queryString)
            
            if(folderResult && folderResult.length == 1) {
                folderId = folderResult[0].id
            } else {
                const folder = await this.createFoler(drive, folderName)
                folderId = folder.data.id;
            }
            console.log("🚀 ~ file: google.ts:162 ~ GoogleDrive ~ uploadMyiprArchive ~ folderId:", folderId)
            const fileStream = fs.createReadStream(filePath);
            const fileId = await this.uploadFile(drive, fileStream, fileName, folderId);
            return `File uploaded with ID: ${fileId}`;
            
        } catch(error) {
            throw error
        }
    }

    async createFoler(drive: any, folderName: string) {
        try {
            const folderMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
            };
        
            const response = await drive.files.create({
                resource: folderMetadata,
                fields: 'id',
            });

            return response
        } catch(error) {
            throw error
        }
    }

    async uploadFile(drive: any, fileStream: ReadStream, fileName: string, folderId: string): Promise<string> {
        try {
            const fileMetadata = {
                name: fileName,
                parents: [folderId], // ID of the destination folder
              };
          
              const media = {
                mimeType: 'application/octet-stream',
                body: fileStream,
              };
          
              const response = await drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id',
              });
          
              return response.data.id;
        } catch(error) {
            throw error
        }
      }



}