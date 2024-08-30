import { Application, Request, Response } from "express";
import { OneDriveController } from "../controller/onedrive.controller";

export class OneDriveRoutes {
    private OnedriveController = new OneDriveController()

    public route(app: Application) {

        app.post('/v1/onedrive/auth-link', (req: Request, res: Response) => {
            this.OnedriveController.getAuthLink(req, res);
        });
        
        app.get('/v1/onedrive/redirect', (req: Request, res: Response) => {
            this.OnedriveController.handleRedirect(req, res);
        });

        app.post('/v1/onedrive/files', (req: Request, res: Response) => {
            this.OnedriveController.getFiles(req, res);
        });
        
        app.post('/v1/onedrive/download', (req: Request, res: Response) => {
            this.OnedriveController.downloadFile(req, res);
        });
    }

 
}
