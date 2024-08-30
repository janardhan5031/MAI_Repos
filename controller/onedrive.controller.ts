import { Request, Response } from 'express';
import { failureResponse, successResponse } from "../response/service";
import { GetOnedriveAuthLink } from '../helper/onedrive-helper/get-auth-link';
import { GetOnedriveAccessToken } from '../helper/onedrive-helper/get-access-token';
import { GetOnedriveFiles } from '../helper/onedrive-helper/search-files';
import { DownloadOnedriveFile } from '../helper/onedrive-helper/download-file';
import * as pathF from 'path';

export class OneDriveController {
    private GetAuthLink = new GetOnedriveAuthLink()
    private GetAccessToken = new GetOnedriveAccessToken()
    private GetOnedriveFiles = new GetOnedriveFiles()
    private Downloadfile = new DownloadOnedriveFile()

    public async getAuthLink(req: Request, res: Response) {
        try {
            const userId = req.body.userId;
            const result = await this.GetAuthLink.getAuthLink(userId);
            let response: any = {link: result}
            response.userId =  userId
            if (result) successResponse('success', response, res, req)
        } catch (error: any) {
            failureResponse(error.message, error, res, req);
        }
    }

    public async handleRedirect(req: Request, res: Response) {
        try {
            const code = req.query.code;
            const userId = req.query.state;
            console.log("🚀 ~ file: onedrive.controller.ts:30 ~ OneDriveController ~ handleRedirect ~ userId:", code, userId)
            
            const result = await this.GetAccessToken.getAccessToken(code, userId);
            
            if (process.env.MYIPR_PROFILE_URL) {
                res.redirect(process.env.MYIPR_PROFILE_URL+'?message=Onedrive account linked successfully')
            } else 
            successResponse('success', result, res, req)
        }
        catch (error: any) {
            failureResponse(error.message, error, res, req);
        }
    }

    public async getFiles(req: Request, res: Response) {
        try {
            const accessToken = req.body.access_token;
            const query = req.body.query;
            console.log("🚀 ~ file: onedrive.controller.ts:49 ~ OneDriveController ~ getFiles ~ query:", query)
            
            const result = await this.GetOnedriveFiles.getOnedriveFiles(accessToken, query);
            successResponse('success', result, res, req)    
        } catch(error: any) {
            
            console.log("🚀 ~ file: onedrive.controller.ts:50 ~ OneDriveController ~ getFiles ~ error:", error)
            failureResponse(error.message, error, res, req);
        }
    }

    public async downloadFile(req: Request, res: Response) {
        try {
            const accessToken = req.body.access_token;
            const path = req.body.file_id;
            const userId = req.body.user_id;
            if(!userId) {
                throw new Error('User ID is required')
            }
            const file = await this.Downloadfile.getFileDetails(accessToken, path)
            console.log("🚀 ~ file: onedrive.controller.ts:67 ~ OneDriveController ~ downloadFile ~ file:", file.id)

            const sizeInKB = file.size;
            const extension = pathF.extname(file.name);
            const localName = Date.now()+'_odr_'+file.id+extension
            const filePath = userId+'/'+'onedrive'+'/'+localName

            const result = this.Downloadfile.downloadOnedriveFile(accessToken, path, userId, filePath);
            console.log("🚀 ~ file: dropbox.controller.ts:57 ~ DropboxController ~ downloadFile ~ result:", result)
            
            successResponse('success', {
                path: filePath,
                size: sizeInKB
            }, res, req)
        } catch(error: any) {
            console.log("🚀 ~ file: dropbox.controller.ts:52 ~ DropboxController ~ downloadFile ~ error:", error)
            failureResponse(error.message, error, res, req);
        }
    }

}