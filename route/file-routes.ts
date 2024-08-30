
import { Application, Request, Response } from 'express';
import { FileController } from '../controller/file.controller';

export class FileRoutes {
    private fileController = new FileController();

    public route(app: Application) {

        // app.post('/v1/file/stream', (req: Request, res: Response) => {
        //     this.fileController.getFileStream(req, res);
        // });

        app.post('/v1/file/unlink', (req: Request, res: Response) => {
            this.fileController.unlinkFile(req, res);
        });

        app.post('/v1/file/save', (req: Request, res: Response) => {
            this.fileController.saveFile(req, res);
        });

        app.post('/v1/file/archive', (req: Request, res: Response) => {
            this.fileController.archiveFileAndReload(req, res)
        })
    }
}