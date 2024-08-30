import { Request, Response } from 'express';
import { failureResponse, successResponse } from "../response/service";
import { GetDropboxAuthLink } from '../helper/dropbox-helper/get-auth-link';
import { GetDropboxAccessToken } from '../helper/dropbox-helper/get-access-token';
import { GetDropboxFiles } from '../helper/dropbox-helper/search-files';
import { DownloadDropboxFile } from '../helper/dropbox-helper/download-file';

export class DropboxController {
    private GetAuthLink = new GetDropboxAuthLink();
    private GetAccessToken = new GetDropboxAccessToken()
    private GetDropboxFiles = new GetDropboxFiles()
    private DownloadFile = new DownloadDropboxFile()

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
            const result = await this.GetAccessToken.getAccessToken(code, userId);
            if (process.env.MYIPR_PROFILE_URL) {
                res.redirect(process.env.MYIPR_PROFILE_URL+'?message=Dropbox account linked successfully')
            } else 
            successResponse('success', result, res, req)
        }
        catch (error: any) {
            console.log("🚀 ~ file: dropbox.controller.ts:36 ~ DropboxController ~ handleRedirect ~ error:", error)
            failureResponse(error.message, error, res, req);
        }
    }

    public async getFiles(req: Request, res: Response) {
        try {
            const accessToken = req.body.access_token;
            const query = req.body.query;
            console.log("🚀 ~ file: dropbox.controller.ts:44 ~ DropboxController ~ getFiles ~ query:", query)
            const result = await this.GetDropboxFiles.getDropboxFiles(accessToken, query);
            successResponse('success', result, res, req)    
        } catch(error: any) {
            console.log("🚀 ~ file: dropbox.controller.ts:43 ~ DropboxController ~ getFiles ~ error:", error)
            failureResponse(error.message, error, res, req);
        }
    }

    public async downloadFile(req: Request, res: Response) {
        try {
            const accessToken = req.body.access_token;
            const path = req.body.path;
            const userId = req.body.user_id;
            if(!userId) {
                throw new Error('user ID is required')
            }
            const fileDetails = await this.DownloadFile.getMetadata(accessToken, path, userId);
            console.log("🚀 ~ file: dropbox.controller.ts:64 ~ DropboxController ~ downloadFile ~ fileDet:", fileDetails)

            const fileName = Date.now()+'_dbx_'+fileDetails.name
            const filePath = userId+'/'+'dropbox'+'/'+fileName
            const sizeInKB = parseFloat((fileDetails.size).toFixed(2))

            const result = this.DownloadFile.downloadFile(accessToken, path, userId, filePath);
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