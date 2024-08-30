import "dotenv/config";
import { InputValidator } from "../constants/validator";
import { ResponseHelper } from "../common/error.service";
import { AssetUtils } from "../utils/asset.utils";
import loggerInstance from "../config/winston";
import { S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_STORAGE_REGION, // Specify your AWS region
  credentials: {
      accessKeyId: process.env.AWS_STORAGE_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_STORAGE_SECRET_ACCESS_KEY ?? '',
  },
});

export class AssetController {
  //to create asset
  public async createAsset(req, res) {
    try {
      //file id
      const id = req?.body?.id;

      //verifying the input given
      InputValidator.validateString(id, "ID", true);
      loggerInstance.info("Verified the input", id);

      //to check hash or path
      const hashPresent = await AssetUtils.assetInfo(req, res);
      loggerInstance.info("Successfully found the file information", id);

      //hash found
      if (hashPresent.isHash) {
        // Of no use as we are now downloading file in all the cases 

        loggerInstance.info("Found hash for the asset", id);

        const asset = await AssetUtils.mint(hashPresent, req, res);
        loggerInstance.info(
          "Successfully completed the asset creation process",
          asset
        );

        ResponseHelper.successResponse(
          `Certificate create successfully for the id=${req.body.id}`,
          asset,
          res,
          200
        );
      } else {
        loggerInstance.info("Found file path for the asset", id);
      }
    } catch (error) {
      loggerInstance.error("Error while creating the asset", error);
      ResponseHelper.failureResponse(
        error?.response?.data?.message ||
          (error?.message ? error?.message : "An error occurred"),
        null,
        res,
        error?.response?.data?.statusCode ||
          (error?.statuscode ? error?.statuscode : 500)
      );
    }
  }

  //to burn asset
  public async burnAsset(req, res) {
    try {
      //file id
      const id = req?.body?.id;

      //verifying the input given
      InputValidator.validateString(id, "ID", true);

      //to burn asset
      const asset = await AssetUtils.burn(res, req);

      loggerInstance.info(
        "Successfully completed the asset Burn process",
        asset
      );
      ResponseHelper.successResponse(
        `Certificate burned successfully for the id=${req?.body?.id}`,
        asset,
        res,
        200
      );
    } catch (error) {
      loggerInstance.error("Error while Burn Process of the asset", error);
      ResponseHelper.failureResponse(
        error?.response?.data?.message ||
          (error?.message ? error?.message : "An error occurred"),
        null,
        res,
        error?.response?.data?.statusCode ||
          (error?.statuscode ? error?.statuscode : 500)
      );
    }
  }

  //to get certificate
  public async getCertificate(req, res) {
    try {
      //file id
      const id = req?.body?.id;

      //verifying the input given
      InputValidator.validateString(id, "ID", true);
      loggerInstance.info("Verified the input", id);

      //to get certificate
      let asset = await AssetUtils.certificate(res, req);

      loggerInstance.info(
        "Successfully generated the certificate for the id",
        id
      );
      ResponseHelper.successResponse(
        `Generated Certificate  successfully for the id=${req.body.id}`,
        asset,
        res,
        200
      );
    } catch (error) {
      loggerInstance.error("Error while generating the certificate", error);
      ResponseHelper.failureResponse(
        error?.response?.data?.message ||
          (error?.message ? error?.message : "An error occurred"),
        null,
        res,
        error?.response?.data?.statusCode ||
          (error?.statuscode ? error?.statuscode : 500)
      );
    }
  }

  public async certificateShare(req, res) {
    try {
      //file id
      const id = req?.body?.id;

      //verifying the input given
      InputValidator.validateString(id, "ID", true);
      loggerInstance.info("Verified the input", id);

      const asset = await AssetUtils.certificate(res, req);

      loggerInstance.info(
        "Successfully generated the certificate link to share",
        id
      );

      ResponseHelper.successResponse(
        `Generated Certificate  successfully for the id=${req.body.id}`,
        asset,
        res,
        200
      );
    } catch (error) {
      loggerInstance.error(
        "Error while generating the certificate link to share",
        error
      );

      ResponseHelper.failureResponse(
        error?.response?.data?.message ||
          (error?.message ? error?.message : "An error occurred"),
        null,
        res,
        error?.response?.data?.statusCode ||
          (error?.statuscode ? error?.statuscode : 500)
      );
    }
  }

  public async verifyAsset(req, res) {
    try {
      //file id
      const id = req?.body?.id;

      //verifying the input given
      InputValidator.validateString(id, "ID", true);
      loggerInstance.info("Verified the input", id);

      const asset = await AssetUtils.verifyCertificate(res, req);

      loggerInstance.info("Successfully found the record fo the id", id);

      ResponseHelper.successResponse(
        `successfully for found the id=${req.body.id}`,
        asset,
        res,
        200
      );
    } catch (error) {
      loggerInstance.error("Error while finding the asset", error);

      ResponseHelper.failureResponse(
        error?.response?.data?.message ||
          (error?.message ? error?.message : "An error occurred"),
        null,
        res,
        error?.response?.data?.statusCode ||
          (error?.statuscode ? error?.statuscode : 500)
      );
    }
  }

  public async transferAsset(req, res) {
    try {
      //file id
      const sender = req?.body?.sender;
      const receiver = req?.body?.receiver;
      const id = req?.body?.assetId;
      req.body.id = id;
      const invokerid = req?.body?.invokerId;

      //verifying the input given
      InputValidator.validateString(sender, "Sender", true);
      InputValidator.validateString(receiver, "Receiver", true);
      InputValidator.validateString(id, "Asset ID", true);
      InputValidator.validateString(invokerid, "Invoker ID", true);

      loggerInstance.info("Verified the input", id);

      const asset = await AssetUtils.transferAsset({
        sender, receiver, id, invokerid, docType: 'ASSET-MYIPR'
      }, req);

      loggerInstance.info("Successfully found the record fo the id", id);

      await AssetUtils.regenerateCertificate(req, res)

      ResponseHelper.successResponse(
        `successfully transferred the asset id=${id}`,
        asset,
        res,
        200
      );
    } catch (error) {
      loggerInstance.error("Error while transferring the asset", error);

      ResponseHelper.failureResponse(
        error?.response?.data?.message ||
          (error?.message ? error?.message : "An error occurred"),
        null,
        res,
        error?.response?.data?.statusCode ||
          (error?.statuscode ? error?.statuscode : 500)
      );
    }
  }

  public async transferAssetHistory(req, res) {
    try {
      const id = req?.body?.assetId;
      const invokerid = req?.body?.invokerId;

      InputValidator.validateString(id, "Asset ID", true);
      InputValidator.validateString(invokerid, "Invoker ID", true);

      loggerInstance.info("Verified the input", id);

      const asset = await AssetUtils.transferAssetHistory({
        id, invokerid
      }, req);

      loggerInstance.info("Successfully fetched transfer history for ", id);

      ResponseHelper.successResponse(
        `successfully fetched transfer history of the asset id=${id}`,
        asset,
        res,
        200
      );
    } catch(error) {
      loggerInstance.error("Error while fetching the asset transfer history", error);

      ResponseHelper.failureResponse(
        error?.response?.data?.message ||
          (error?.message ? error?.message : "An error occurred"),
        null,
        res,
        error?.response?.data?.statusCode ||
          (error?.statuscode ? error?.statuscode : 500)
      );
    }
  }

  public async regenerateCertificate(req, res) {
    try {
      await AssetUtils.regenerateCertificate(req, res)
    }
    catch(error) {
      loggerInstance.error("Error while regenerating the certificate - ", error);

      ResponseHelper.failureResponse(
        error?.response?.data?.message ||
          (error?.message ? error?.message : "An error occurred"),
        null,
        res,
        error?.response?.data?.statusCode ||
          (error?.statuscode ? error?.statuscode : 500)
      );
    }
  }

}
