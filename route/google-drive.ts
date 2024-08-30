
import { Application, Request, Response } from 'express';
import { GoogleDriveController } from '../controller/google-drive.crontroller';

export class GoogleDriveRoutes {
    private googleDriveController = new GoogleDriveController();

    public route(app: Application) {

        app.post('/v1/google/auth-link', (req: Request, res: Response) => {
            this.googleDriveController.getAuthLink(req, res);
        });

        app.get('/v1/google/redirect', (req: Request, res: Response) => {
            this.googleDriveController.handleRedirect(req, res);
        });

        app.post('/v1/google/get-files', (req: Request, res: Response) => {
            this.googleDriveController.getFilesList(req, res);
        });

        app.post('/v1/google/get-file', (req: Request, res: Response) => {
            this.googleDriveController.getFile(req, res);
        });
    }
}