import { Application, Request, Response } from "express";
import { DropboxController } from "../controller/dropbox.controller";

export class DropboxRoutes {
    private dropboxController = new DropboxController()

    public route(app: Application) {

        app.post('/v1/dropbox/auth-link', (req: Request, res: Response) => {
            this.dropboxController.getAuthLink(req, res);
        });

        app.get('/v1/dropbox/redirect', (req: Request, res: Response) => {
            this.dropboxController.handleRedirect(req, res);
        });

        app.post('/v1/dropbox/files', (req: Request, res: Response) => {
            this.dropboxController.getFiles(req, res);
        });

        app.post('/v1/dropbox/download', (req: Request, res: Response) => {
            this.dropboxController.downloadFile(req, res);
        });
   
    }

 
}
