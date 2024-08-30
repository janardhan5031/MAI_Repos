
import { Application, Request, Response } from 'express';
export class CommonRoutes {

    public route(app: Application) {

        // Mismatch URL
        app.all('/', function (req: Request, res: Response) {
            res.status(200).json({ error: false, message: "I am up" });
            // res.status(404).send({ error: true, message: 'Check your URL please' });
        });

        app.get("/health", function (req: Request, res: Response) {
            res.status(200).json({ error: false, message: "I am up" });
        });
    }
}