import "dotenv/config";
import express from "express";
import { AssetRoutes } from "../routes/asset_route";
import cors from "cors";
import bodyParser from "body-parser";

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
  }

  private initializeMiddleware(): void {
    this.app.use(bodyParser.json({ limit: "10gb" }));
    this.app.use(bodyParser.urlencoded({ limit: "10gb", extended: true }));

    const allowedOrigins = ["*","http://127.0.0.1:3000" , "https://dev-myipr.p2eppl.com","https://stg-myiprapi.p2eppl.com","https://qa-myiprapi.p2eppl.com"];

    const options: cors.CorsOptions = {
       origin: allowedOrigins
    };

    this.app.use(cors(options));
  }

  private initializeRoutes(): void {
    const assetRoutes = new AssetRoutes();
    assetRoutes.initialize(this.app);
  }
}

export default new App().app;
