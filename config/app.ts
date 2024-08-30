import express from "express";
import {
  CommonRoutes,
  GoogleDriveRoutes,
  FileRoutes,
  AwsS3Routes,
  DropboxRoutes,
  OneDriveRoutes
} from "../route/index";
import cors from "cors";
import BodyParser from "body-parser";

class App {
  public app: express.Application;

  public common_route = new CommonRoutes();
  public google_route = new GoogleDriveRoutes();
  public file_route = new FileRoutes();
  public s3_route = new AwsS3Routes();
  public dropbox_routes = new DropboxRoutes()
  public onedrive_routes = new OneDriveRoutes()

  constructor() {
    this.app = express();

    const allowedOrigins = ["*"];

    const options: cors.CorsOptions = {
      origin: allowedOrigins,
    };

    this.app.use(cors(options));
    this.app.use(
      BodyParser.json({
        verify: function (req: any, res: any, buf: any, encoding: any) {
          req.rawBody = buf;
        },
      })
    );

    this.common_route.route(this.app);
    this.google_route.route(this.app);
    this.file_route.route(this.app);
    this.s3_route.route(this.app);
    this.dropbox_routes.route(this.app);
    this.onedrive_routes.route(this.app)
  }
}
export default new App().app;
