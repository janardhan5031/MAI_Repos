import "dotenv/config";
import { AssetHelper } from "../helpers/asset.helpers";
import { BlockchainHelper } from "../helpers/blockchain.helpers";
import { CertificateHelper } from "../helpers/certificate.helpers";
import { S3Helper } from "../helpers/s3.helpers";
import { MailHelper } from "../helpers/mail.helpers";
import "dotenv/config";
import loggerInstance from "../config/winston";
import { S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_STORAGE_REGION, // Specify your AWS region
  credentials: {
      accessKeyId: process.env.AWS_STORAGE_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_STORAGE_SECRET_ACCESS_KEY ?? '',
  },
});

export class AssetUtils {
  //to get the asset details
  public static async assetInfo(req, res) {
    try {
      const searchFile = req.body.id;

      //to get the file version
      const fileData = await AssetHelper.getFileVersion(searchFile, res);

      const { fileId, path, original_hash, user, certificate_owner_name, category } = fileData;

      await AssetHelper.getUserInfo(req,res,user.id);

      const assetInfo = {
        isHash: !!original_hash,
        value: original_hash ? original_hash : path,
        path: path, // adding path separately - will remove above value in refactoring
        asset: fileData,
        category: category,
        certName: certificate_owner_name
      };

      loggerInstance.info("Successfully found the asset details", assetInfo);

      return assetInfo;
    } catch (error) {
      await AssetHelper.assetCreationError(req.body.id, 102, 'Error while get the asset details from MyIPR');
      loggerInstance.error("Error while get the asset details", error);
      throw error;
    }
  }

  public static async transferAsset(data: any, res) {
    try {
      
      const transferData: any =   await BlockchainHelper.transferAssetOnBlockchain(
        data,
        res
      );

      return transferData;
    } catch(error) {
      loggerInstance.error("Error in transferring asset", error);
      throw error;
    }
  }

  public static async transferAssetHistory(data: any, res) {
    try {
      
      console.log(data)
      
      const transferData: any =   await BlockchainHelper.assetHistory(
        data,
        res
      );
      console.log("🚀 ~ file: asset.utils.ts:75 ~ AssetUtils ~ transferAssetHistory ~ transferData:", transferData)

      return transferData;
    } catch(error) {
      loggerInstance.error("Error in fetching asset history", error);
      throw error;
    }
  }

  //process of minting
  public static async mint(hashPresent: any, req: any, res: any) {
    try {

      //to check the hash is minted on blockchain or not
      await AssetHelper.checkHashForAsset(req,hashPresent.value, res);
      loggerInstance.info(
        "Asset is not minted in the blockchain",
        hashPresent
      );

      //to minted the data on blockchain
      let mintedData = await BlockchainHelper.createAssetOnBlockchain(
        hashPresent,
        req,
        res
      );

      //to generate certificate
      await CertificateHelper.createPdf(hashPresent, mintedData, req.user.result);
      loggerInstance.info(
        "Sucessfully generated the certificate for the asset",
        req.body.id
      );

      //upload the certificate to the s3
      let link = await S3Helper.uploadFile(mintedData, req);
      loggerInstance.info(
        "Successfully uploaded the certificate to the S3",
        link
      );

      //to send the certificate through mail
      await MailHelper.sendCertificateThroughMail(
        req,
        mintedData.txId,
        hashPresent
      );

      //to create a record in mongodb for certificate
      const version = await AssetHelper.updateFileVersion(req.body.id, 
      {
        minted_hash: hashPresent.value,
        transaction_id: mintedData?.txId,
        certificate_link: link,
        statusId: 7
      })
      console.log("🚀 ~ file: asset.utils.ts:106 ~ AssetUtils ~ mint ~ Asset Created for version:", version)

      return mintedData;
    } catch (error) {
      loggerInstance.error("Error in Minting process", error);
      await AssetHelper.assetCreationError(req.body.id, 101, 'Error in minting asset on the blockchain');
      throw error;
    }
  }

  //to burn
  public static async burn(res: any, req: any) {
    try {
      const id = req.body.id;

      //to get the file version
      const fileData = await AssetHelper.FileVersion(id, res);
      
      //to burn asset on block chain
      const burnedData: any =   await BlockchainHelper.burnAssetOnBlockchain(
        req,
        res
      );
      //delete the certificate from s3
      await S3Helper.deleteS3File(fileData?.certificate_link);

       //to send the certificate through mail
      await MailHelper.sendBurnCertificateThroughMail(
        req,
        fileData.name
      );

      //to create a burn record on mongo
      await AssetHelper.updateFileVersion(
        fileData?.version_id,
        {
          transaction_id: burnedData?.txId,
          statusId: 8
        }
      )

      return burnedData;
    } catch (error) {
      loggerInstance.error("Error while burning the asset", error);
      throw error;
    }
  }

  public static async certificate(res: any, req: any) {
    try {
      const searchTerm = req.body.id;

      //to get the file details
      const version = await AssetHelper.FileVersion(searchTerm, res);

      if(version.version_id && version.status.status == 'certificate_burned') {
        loggerInstance.error("Asset burned from blockchain of id", searchTerm);
      } 

      //to get the download link from s3;
      let downloadlink = await S3Helper.findcertificateOnS3(version.certificate_link);
      return { certificateDetails: version, fileLink: downloadlink };
    } catch (error) {
      loggerInstance.error("Error while getting the certificate", error);
      throw error;
    }
  }

  //to verify hash present in the system
  public static async verifyCertificate(res: any, req: any) {
    try {
      const searchTerm = req.body.id;

      //to get the file details
      const version = await AssetHelper.FileVersion(searchTerm, res);

      if(version.version_id && version.status.status == 'certificate_burned') {
        loggerInstance.error("Asset burned from blockchain of id", searchTerm);
      } 

      return { certificateDetails: version };
    } catch (error) {
      loggerInstance.error("Error while getting the certificate", error);
      throw error;
    }
  }

  public static async regenerateCertificate(req, res) {
    try {
      const searchTerm = req.body.assetId;
      console.log("🚀 ~ file: asset.utils.ts:219 ~ AssetUtils ~ regenerateCertificate ~ searchTerm:", searchTerm)

      //to get the file details
      const version = await AssetHelper.FileVersion(searchTerm, res);

      if(version.version_id && version.status.status == 'certificate_burned') {
        loggerInstance.error("Asset burned from blockchain of id", searchTerm);
      } 

      const hashPresent = await AssetUtils.assetInfo(req, res);
      loggerInstance.info("Successfully found the file information", searchTerm);

      const mintedData = {
        txId: version.transaction_id,
        createdOn: version.lastUpdatedAt
      }

      const assetData = {
        id: version.version_id, invokerid: req.user.result.blockchainSerialId
      }

      const assetHistory = await AssetUtils.transferAssetHistory(assetData, req);
      
      //to generate certificate
      await CertificateHelper.createPdf(hashPresent, mintedData, req.user.result, assetHistory);

      loggerInstance.info(
        "Sucessfully generated the certificate for the asset",
        req.body.id
      );

      //upload the certificate to the s3
      let link = await S3Helper.uploadFile(mintedData, req);
      console.log("🚀 ~ file: asset.utils.ts:108 ~ AssetUtils ~ mint ~ link:", link)
      loggerInstance.info(
        "Successfully uploaded the certificate to the S3",
        link
      );

      await AssetHelper.updateFileVersion(req.body.id, 
      {
        certificate_link: link,
        transaction_id: mintedData.txId
      })

      // //to send the certificate through mail
      // await MailHelper.sendCertificateThroughMail(
      //   req,
      //   mintedData.txId,
      //   hashPresent
      // );

      return link
      
    } catch (error) {
      loggerInstance.error("Error while getting the certificate", error);
      throw error;
    }
  }
}
