import "dotenv/config";
import { Application, Request, Response } from "express";
import { AssetController } from "../controller/asset";
import loggerInstance from "../config/winston";
import { auth } from "../middleware/auth";

export class AssetRoutes {
  private assetController = new AssetController();

  public initialize(app: Application): void {
    this.configureRoutes(app);
    this.configureHealthCheckRoute(app);
    this.configureMismatchRoute(app);
  }

  private configureRoutes(app: Application) {
    // Create asset on blockchain
    app.post("/v1/create-certificate", this.assetController.createAsset);

    //route for certification Burn
    app.post("/v1/burn-certificate", auth, this.assetController.burnAsset);

    //route for get certificate
    app.post("/v1/get-certificate", auth, this.assetController.getCertificate);

    //route for share certificate
    app.post("/v1/share-certificate",auth,this.assetController.certificateShare);

    //route to verfiy hash the Asset
    app.post("/v1/verify-asset", this.assetController.verifyAsset);

    // route to transfer asset
    app.post("/v1/transfer-asset", this.assetController.transferAsset)

    // route to see asset transfer history 
    app.post("/v1/asset-history", this.assetController.transferAssetHistory)

    app.post("/v1/regenerate-cert", this.assetController.regenerateCertificate)
  }

  //health-check
  private configureHealthCheckRoute(app: Application): void {
    app.get("/health-check", async function (req: Request, res: Response) {
      try {
        res
          .status(200)
          .send({ error: false, message: "Health check successful" });
      } catch (error) {
        res.status(500).send({ error: true, message: "Health check failed" });
      }
    });
  }

  // Mismatch URL
  private configureMismatchRoute(app: Application): void {
    app.all("*", (req: Request, res: Response) => {
      loggerInstance.warn("Wrong URL");
      res.status(404).send({ error: true, message: "Check your URL, please" });
    });
  }
}
