import { Request, Response } from 'express';
import { GetAuthLink } from "../helper/google-helper/get-auth-link";
import { failureResponse, successResponse } from "../response/service";
import { GetAccessToken } from '../helper/google-helper/get-tokens';
import { ListFiles } from '../helper/google-helper/list-files';
import { GetFile } from '../helper/google-helper/get-file';
import { GetFileDetails } from '../helper/google-helper/get-file-details';
import * as path from 'path';

export class GoogleDriveController {
    private GetAuthLink = new GetAuthLink();
    private GetAccessToken = new GetAccessToken();
    private ListFiles = new ListFiles();
    private GetFile = new GetFile();
    private GetFileDetails = new GetFileDetails();

    public async getAuthLink(req: Request, res: Response) {
        try {
            const userId = req.body.userId;
            const result = await this.GetAuthLink.getAuthLink(userId);
            let response: any = {link: result}
            response.userId=  userId
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
                res.redirect(process.env.MYIPR_PROFILE_URL+'?message=Google Drive account linked successfully')
            } else successResponse('success', result, res, req)
        }
        catch (error: any) {
            failureResponse(error.message, error, res, req);
        }
    }

    public async getFilesList(req: Request, res: Response) {
        try {
            const accessToken = req.body.access_token;
            const query = req.body.query;
            const result = await this.ListFiles.getFilesList(accessToken, query);
            if (result) successResponse('success', result, res, req)
        }
        catch (error: any) {
            // intentionally cleaning the result field
            failureResponse(error.message, {}, res, req);
        }
    }

    public async getFile(req: Request, res: Response) {
        try {
            const accessToken = req.body.access_token;
            const fileId = req.body.file_id;
            const userId = req.body.user_id;

            if(!accessToken || !fileId || !userId) {
                throw new Error('Access token / file id / user id are required')
            }
            const fileDetails: any = await this.GetFileDetails.getFileDetails(accessToken, fileId);
            
            const extension = path.extname(fileDetails.name);
            console.log("🚀 ~ file: google-drive.crontroller.ts:68 ~ GoogleDriveController ~ getFile ~ extension:", extension)
            const fileName = userId+'/google/'+Date.now() + '_gd_' + fileDetails.id+extension;

            const sizeInKB = Math.ceil(fileDetails.size / 1024);

            this.GetFile.getFile(accessToken, fileId, sizeInKB, fileName);
            fileDetails.path = fileName
            fileDetails.size = sizeInKB
            
            successResponse('success', fileDetails, res, req)
        }
        catch (error: any) {
            // intentionally cleaning the result field
            failureResponse(error.message, {}, res, req);
        }
    }

}