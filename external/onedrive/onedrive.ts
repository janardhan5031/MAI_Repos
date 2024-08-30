import axios, { AxiosResponse } from "axios";
import crypto from'crypto';
import { sendMyIPRFileUploadedWebhook } from "../../helper/myipr-helper/send-myipr-file-uploaded-webhook";
import { S3Client, PutObjectCommand, ListObjectsCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from "typeorm/platform/PlatformTools";
import { Upload } from "@aws-sdk/lib-storage";

const baseDir = 'onedrive'

const maxSize = 5.5 * 1000 * 1000 * 1000

const s3 = new S3Client({
    region: process.env.AWS_REGION, // Specify your AWS region
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    },
});

export class Onedrive {
    private sendFileUploadWebhook = new sendMyIPRFileUploadedWebhook()
   
    async getAuthLink(userId: any) {
        console.log("🚀 ~ file: onedrive.ts:12 ~ Onedrive ~ getAuthLink ~ userId:", userId)
        try {
            const clientId = process.env.ONEDRIVE_CLIENT_ID
            const redirectUri = process.env.ONEDRIVE_REDIRECT_URI
            const scope = process.env.ONEDRIVE_SCOPE
            return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${userId}&custom_id=${userId}`;
        } catch(error) {
            throw error;
        }
    }

    async getAccessToken(code: string, userId: string) 
    {
        try {
            const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
            
            let params = {
                grant_type: process.env.ONEDRIVE_GRANT_TYPE ? process.env.ONEDRIVE_GRANT_TYPE : '',
                code: code ? code : '',
                redirect_uri: process.env.ONEDRIVE_REDIRECT_URI ? process.env.ONEDRIVE_REDIRECT_URI : '',
                client_id: process.env.ONEDRIVE_CLIENT_ID ? process.env.ONEDRIVE_CLIENT_ID : '',
                client_secret: process.env.ONEDRIVE_CLIENT_SECRET ? process.env.ONEDRIVE_CLIENT_SECRET : '',
                scope: process.env.ONEDRIVE_SCOPE ? process.env.ONEDRIVE_SCOPE : '',
              };
            console.log("🚀 ~ file: onedrive.ts:38 ~ Onedrive ~ params:", JSON.stringify(params))

            const requestBody = new URLSearchParams();
            requestBody.append('grant_type', params.grant_type);
            requestBody.append('code', params.code);
            requestBody.append('redirect_uri', params.redirect_uri);
            requestBody.append('client_id', params.client_id);
            requestBody.append('client_secret', params.client_secret);
        
            const {data} = await axios.post(tokenUrl, requestBody, {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            });

            return data
        } catch(error: any) {
            console.log(error.response.data.error_description)
            throw error.response.data.error_description
        }
    }

    async getUserProfile(accessToken: string) {
        try {
            const {data} = await axios.get('https://graph.microsoft.com/v1.0/me', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            console.log("🚀 ~ file: onedrive.ts:65 ~ Onedrive ~ getUserProfile ~ data:", data)
            return data;
        } catch(error:any) {
            console.log("🚀 ~ file: onedrive.ts:67 ~ Onedrive ~ getUserProfile ~ error:", error.response.data.error)
            throw error
        }
    }

    async getFilesList(accessToken: string, q?: string) {
        try {
            let url = `https://graph.microsoft.com/v1.0/me/drive/root/children`;
            if (q) {
                url = `https://graph.microsoft.com/v1.0/me/drive/root/search(q='${q}')`;
            }
    
            const {data} = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
    
            let files:any = []
    
            for(let file of data.value) 
            {
                const thisFile = {
                    id: file.id, 
                    name: file.name,
                    size: (file.size/1024).toFixed(2),
                    updated_at: file.lastModifiedDateTime
                }
    
                
                if(thisFile.size == '0.00') continue
    
                files = [...files, thisFile]
            }
    

            if (!q) {
                files.sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));
            }
            return files;
        } catch(error) {
            throw error
        }
    }
    async getFileDetails(accessToken: string, fileId: string) {
        try {
            const {data} = await axios.get(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            return data;
        } catch(error) {
            console.log("🚀 ~ file: onedrive.ts:104 ~ Onedrive ~ getFileDetails ~ error:", error)
            throw error
        }
    }

    async downloadFile(accessToken: string, fileId: string, userId: string, storePath: string) {
        try { 
            
            const filePath = storePath

            const url = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;

            // Specify the headers with the access token and file path
            const headers = {
                'Authorization': `Bearer ${accessToken}`,
                responseType: 'stream',
            };
            
            // Send the HTTP GET request to download the file
            const odRes = await axios.get(url, {
                headers: headers,
                responseType: 'stream',
            })

            let sha256: string = '';

            const hash = crypto.createHash('sha256');
            odRes.data.on('data', (data: crypto.BinaryLike) => {
                hash.update(data);
            });
            odRes.data.on('end', () => {
                sha256 = hash.digest('hex');
                console.log(null, sha256);
            });
            odRes.data.on('error', (error: any) => {
                console.log(error);
            });

            const target = {
                Bucket: process.env.AWS_PUBLIC_BUCKET_NAME,
                Key: filePath,
                Body: odRes.data as Readable, // Use the stream directly
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
                // await this.sendFileUploadWebhook.sendMyIPRFileUploadedWebhook(filePath, sha256);    
            } catch (e) {
                console.log(e);
            }

            try {
                await this.sendFileUploadWebhook.sendMyIPRFileUploadedWebhook(filePath, sha256);
            } catch (error: any) {
                console.error("Error sending webhook:", JSON.stringify(error));
            }

        } catch(error) {
            console.log('ERROR----- onedrive.ts 181', error)
            throw error;
        }
    }
}