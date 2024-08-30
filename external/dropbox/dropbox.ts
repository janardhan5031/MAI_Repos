import axios, { AxiosResponse } from "axios";
import crypto from'crypto';
import QueryString from "qs";
import fs from 'fs';
import { sendMyIPRFileUploadedWebhook } from "../../helper/myipr-helper/send-myipr-file-uploaded-webhook";
import { ReadStream, Readable } from "typeorm/platform/PlatformTools";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from "@aws-sdk/lib-storage";

const baseDir = 'dropbox'
const folderName = 'myipr'

const maxSize = 5.5 * 1000 * 1000 * 1000

const s3 = new S3Client({
    region: process.env.AWS_REGION, // Specify your AWS region
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    },
});

export class Dropbox {
    private sendFileUploadWebhook = new sendMyIPRFileUploadedWebhook()
    
    async getAuthLink(userId: any) {
        try {
            const clientId = process.env.DBX_APP_KEY
            const redirectUri = process.env.DBX_REDIRECT_URI
            return `https://www.dropbox.com/oauth2/authorize?token_access_type=offline&client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${userId}`;
        } catch(error) {
            throw error;
        }
    }

    async getAccessToken(code: string, userId: string) 
    {
        try {
            let params = QueryString.stringify({
                'code': code,
                'grant_type': 'authorization_code',
                'client_id': process.env.DBX_APP_KEY,
                'client_secret': process.env.DBX_APP_SECRET,
                'redirect_uri': process.env.DBX_REDIRECT_URI 
              });

            const {data} = await axios.post('https://api.dropbox.com/oauth2/token', params, 
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });
            console.log("🚀 ~ file: dropbox.ts:41 ~ Dropbox ~ data:", data)
            
            return data
        } catch(error: any) {
            console.log(error.response.data.error_description)
            throw error.response.data.error_description
        }
    }

    async getUserProfile(accessToken: string) {
        try {
            
            const {data} = await axios.post('https://api.dropboxapi.com/2/users/get_current_account', null, 
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            });

            return data
        } catch(error: any) {
            console.log(error.response.data.error_description)
            throw error.response.data.error_description
        }
    }

    async getFilesList(accessToken: string, query: string) {
        console.log("🚀 ~ file: dropbox.ts:63 ~ Dropbox ~ getFilesList ~ accessToken:", query)
        try {
            let resFiles = []

            if(!query) {
                const {data} = await axios.post('https://api.dropboxapi.com/2/files/list_folder', 
                {
                    "include_deleted": false,
                    "include_has_explicit_shared_members": false,
                    "include_media_info": false,
                    "include_mounted_folders": true,
                    "include_non_downloadable_files": true,
                    "path": "",
                    "recursive": false,
                }, 
                {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json"
                    }
                });
                
                for(let file of data.entries) {
                    if(file.size) {
                        resFiles.push({
                            id: file.id,
                            name: file.name,
                            size: file.size
                        })
                    }
                }
            
            } else 
            {
                const {data} = await axios.post('https://api.dropboxapi.com/2/files/search_v2', 
                {
                    "match_field_options": {
                        "include_highlights": false
                    },
                    "options": {
                        "file_status": "active",
                        "filename_only": true,
                        "max_results": 20,
                        // "path": 'root'
                        "file_categories": ['image', 'document', 'pdf', 'spreadsheet', 'presentation', 'audio', 'video']
                    },
                    "query": query
                }, 
                {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json"
                    }
                });

                for(let file of data.matches) {
                    console.log(file)
                    resFiles.push({
                        id: file.metadata.metadata.id,
                        name: file.metadata.metadata.name,
                        size: (file.metadata.metadata.size/1024).toFixed(2)
                    })
                }
            }

            return resFiles
        } catch(error: any) {
            console.log("🚀 ~ file: dropbox.ts:87 ~ Dropbox ~ getFilesList ~ console.log(error):", error)
            throw error
        }
    }

    async getMetadata(accessToken: string, path: string, userId: string) {
        try {
            const {data} = await axios.post('https://api.dropboxapi.com/2/files/get_metadata', 
                {
                    "path": path
                }, 
                {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json"
                    }
                });

            return data
        } catch (e) {
            throw e
        }
    }

    async downloadFile(accessToken: string, path: string, userId: string, savePath: string) {
        try {
            const url = 'https://content.dropboxapi.com/2/files/download';

            // Specify the headers with the access token and file path
            const headers = {
                'Authorization': `Bearer ${accessToken}`,
                'Dropbox-API-Arg': JSON.stringify({ path: path }),
            };

            // Send the HTTP GET request to download the file
            const dbxRes = await axios.get(url, {
                headers: headers,
                responseType: 'stream',
            })

            const filePath = savePath
            let sha256: string = '';

            const hash = crypto.createHash('sha256');
            dbxRes.data.on('data', (data: crypto.BinaryLike) => {
                hash.update(data);
            });
            dbxRes.data.on('end', () => {
                sha256 = hash.digest('hex');
                console.log(null, sha256);
            });
            dbxRes.data.on('error', (error: any) => {
                console.log(error);
            });

            const target = {
                Bucket: process.env.AWS_PUBLIC_BUCKET_NAME,
                Key: filePath,
                Body: dbxRes.data as Readable, // Use the stream directly
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
                console.log(e);
            }

            try {
                await this.sendFileUploadWebhook.sendMyIPRFileUploadedWebhook(filePath, sha256);
            } catch (error: any) {
                console.error("Error sending webhook:", JSON.stringify(error));
            }

            
            return {
                "path": filePath,
            };
        } catch(error) {
            console.error('Error downloading file - Dropbox:', error);
            throw error
        }
    }

    async uploadMyiprArchive(accessToken: string, fileName: string, filePath: string) {
        try {
            const response = await axios.post('https://api.dropboxapi.com/2/files/list_folder', 
            {
                "include_deleted": false,
                "include_has_explicit_shared_members": false,
                "include_media_info": false,
                "include_mounted_folders": true,
                "include_non_downloadable_files": true,
                "path": "",
                "recursive": false
            }, 
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            });
            
            let folderId;
            const matchingFolders = response.data.entries.filter(
                (match: any) => match['.tag'] === 'folder' && match.name === folderName,
            );
            
            if(!matchingFolders.length) {
                
                const {data} = await axios.post('https://api.dropboxapi.com/2/files/create_folder_v2', 
                {
                    "autorename": false,
                    "path": '/'+folderName
                }, 
                {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json"
                    }
                });
                console.log("🚀 ~ file: dropbox.ts:198 ~ Dropbox ~ uploadMyiprArchive ~ createFolderRes:", data)
                folderId = data.metadata.id
            } else {
                folderId = matchingFolders[0].id
                console.log("🚀 ~ file: dropbox.ts:202 ~ Dropbox ~ uploadMyiprArchive ~ matchingFolders[0]:", matchingFolders[0])
            }

            console.log(folderId);

            const fileStream = fs.createReadStream(filePath);
            await this.uploadFile(accessToken, fileStream, fileName, folderId);
            return `File uploaded`;

        } catch(error) {
            console.log("🚀 ~ file: dropbox.ts:180 ~ Dropbox ~ uploadMyiprArchive ~ error:", error)
            throw error
        }
    }

    async findFolderByName(accessToken: string) {
        try {
            
            const {data} = await axios.post('https://api.dropboxapi.com/2/files/search', 
            {
                query: folderName,
                options: {
                  path: '',
                  max_results: 10,
                  file_status: 'active',
                  filename_only: true,
                },
            }, 
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            });
            console.log("🚀 ~ file: dropbox.ts:203 ~ Dropbox ~ findFolderByName ~ data:", data)

            const matchingFolders = data.matches.filter(
                (match: any) => match.metadata['.tag'] === 'folder' && match.metadata.name === folderName,
            );

            return matchingFolders;
        } catch(error) {
            console.log("🚀 ~ file: dropbox.ts:162 ~ Dropbox ~ findFolderByName ~ error:", error)
            throw error
        }
    }

    async uploadFile(accessToken: string, fileStream: ReadStream, fileName: string, folderId: string) {
        console.log("🚀 ~ file: dropbox.ts:249 ~ Dropbox ~ uploadFile ~ fileName:", fileName)
        try { 
            const {data} = await axios.post('https://content.dropboxapi.com/2/files/upload', 
            {
                data: fileStream
            }, 
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/octet-stream",
                    "Dropbox-API-Arg": JSON.stringify({
                        "autorename": true,
                        "mode": "add",
                        "mute": false,
                        "path": "/"+folderName+'/'+fileName,
                        "strict_conflict": true
                    })
                }
            });
            console.log("🚀 ~ file: dropbox.ts:268 ~ Dropbox ~ uploadFile ~ data:", data)    
            return data;       
        } catch(error) {
            throw error
        }
    }

}