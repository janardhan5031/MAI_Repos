import { Response } from "express";
import { ResponseHelper } from "../common/error.service";
import { AxiosService } from "../service/axios.service";
import { AssetHelper } from "./asset.helpers";
import loggerInstance from "../config/winston";
import axios from "axios";

export class BlockchainHelper {
  //to create asset on block chain
  public static async createAssetOnBlockchain(
    hashPresent: any,
    req: any,
    res: any
  ) {
    try {
      const user = req?.user?.result;
      const asset = hashPresent?.asset;
      const category = hashPresent?.category;
      const id=req?.body?.id;

      const { blockchainSerialId, blockchainEnrolmentId } = user;
      if (!blockchainSerialId || !blockchainEnrolmentId) {
        loggerInstance.error("User is not registered on block chain", user);

        await AssetHelper.assetCreationError(id, 101, "User is not registered on blockchain");

        throw ResponseHelper.failureResponse(
          `blockchainSerialId or blockchainEnrolmentId not found for the user`,
          null,
          res,
          404
        );
      }
      const data = JSON.stringify({
        invokerid: user?.blockchainSerialId,
        account: [user?.blockchainEnrolmentId],
        docType: "ASSET-MYIPR",
        id: asset?.version_id,
        name: asset?.version_name,
        type: category?.name,
        assetDigest: hashPresent?.value,
        desc: "NoData",
        status: "COMPLETED",
        uri: "N/A",
      });

      const config = {
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": "application/json",
          origin: `${process.env.ORIGIN}`,
        },
      };

      const response = await AxiosService.post(
        `${process.env.BLOCKCHAIN_URL}/v1/asset/create`,
        data,
        config
      );

      loggerInstance.info(
        "Successfully minted the asset on block chain",
        response?.data
      );

      await AssetHelper.updateFileVersion(asset?.version_id, {minted_hash: hashPresent?.value, statusId: 5})

      loggerInstance.info("Updated the file status", asset.version_id);

      const txId = response?.data?.response?.txId;
      const createdOn = response?.data?.response?.transactionData?.created_on;

      if (txId === undefined || createdOn === undefined) {
        await AssetHelper.assetCreationError(id, 101, "Asset is minted on Blockchain but TransactionID not sent");

        loggerInstance.error(
          "Asset is minted on Blockchain but TransactionID not sent",
          response
        );

        throw ResponseHelper.failureResponse(
          "Asset is minted on Blockchain but TransactionID not sent",
          null,
          res,
          404
        );
      }

      return { txId, createdOn };
    } catch (error) {
      loggerInstance.error(
        "Error while minting the asset on block chain",
        error
      );
      throw error;
    }
  }

  //to burn asset on blockchain
  public static async burnAssetOnBlockchain(req: any, res) {
    try {
      const user = req.user.result;

      let data = JSON.stringify({
        id: req.body.id,
        amount: 1,
        invokerid: user.blockchainSerialId,
        account: user.blockchainEnrolmentId,
      });

      let config = {
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": "application/json",
          origin: `${process.env.ORIGIN}`,
        },
      };

      const response = await AxiosService.post(
        `${process.env.BLOCKCHAIN_URL}/v1/asset/burn`,
        data,
        config
      );

      const txId = response?.data?.response?.txId;
      const createdOn = response?.data?.response?.transactionData?.deleted_on;

      loggerInstance.info("Successfully burned the asset on blockchain", txId);
      return { txId, createdOn };
    } catch (error) {
      loggerInstance.error(
        "Error while burning the asset on block chain",
        error
      );
      throw error;
    }
  }

  public static async transferAssetOnBlockchain(
    data: {sender: string, receiver: string, id: string, invokerid: string, docType: string},
    res: any
  ) {
    try {
      const body = JSON.stringify({
        docType: data.docType,
        senders: [data.sender],
        receivers: [data.receiver],
        id: data.id,
        invokerid: data.invokerid
      })

      const config = {
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": "application/json",
          origin: `${process.env.ORIGIN}`,
        },
      };

      const response = await AxiosService.post(
        `${process.env.BLOCKCHAIN_URL}/v1/asset/transfer`,
        body,
        config
      );

      loggerInstance.info(
        "Successfully transferred asset on the blockchain",
        response?.data
      );

      const txId = response?.data?.response?.txId;
      const transferredOn = response?.data?.response?.transactionData?.transfered_on;

      if (txId === undefined || transferredOn === undefined) {
        await AssetHelper.assetCreationError(data.id, 101, "Asset is transferred on Blockchain but TransactionID not sent");

        loggerInstance.error(
          "Asset is transferred on Blockchain but TransactionID not sent",
          response
        );

        throw ResponseHelper.failureResponse(
          "Asset is transferred on Blockchain but TransactionID not sent",
          null,
          res,
          404
        );
      }

      return { txId, transferredOn };
    } catch (error) {
      loggerInstance.error(
        "Error while transferring the asset on block chain",
        error
      );
      throw error;
    }
  }

  public static async assetHistory(data, res) {
    
      const body = JSON.stringify({
        id: data.id,
        invokerid: data.invokerid
      })

      let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${process.env.BLOCKCHAIN_URL}/v1/asset/query/history`,
        headers: { 
          'Origin': process.env.ORIGIN, 
          'Content-Type': 'application/json'
        },
        data : body
      };

      return await axios.request(config)
      .then((response) => {
        loggerInstance.info(
          "Successfully fetched transfer history",
        );

        return response.data.response
      })
      .catch((error) => {
        loggerInstance.error(
          "Error while fetching asset history",
          error
        );
        throw error;
      });

      // const config = {
      //   maxBodyLength: Infinity,
      //   headers: {
      //     "Content-Type": "application/json",
      //     Origin: `${process.env.ORIGIN}`,
      //   },
      //   data: body
      // };
      // console.log("🚀 ~ file: blockchain.helpers.ts:214 ~ BlockchainHelper ~ assetHistory ~ config:", config)

      // const response = await AxiosService.get(
      //   `${process.env.BLOCKCHAIN_URL}/v1/asset/query/history`,
      //   config
      // );
     
  }

}
