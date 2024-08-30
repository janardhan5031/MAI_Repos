import { Response } from "express";
import { ResponseHelper } from "../common/error.service";
import { AxiosService } from "../service/axios.service";
import loggerInstance from "../config/winston";

export class AssetHelper {
  //to get the file version
  public static async getFileVersion(searchTerm: any, res: any) {
    try {
      const config = {
        headers: {
          Authorization: `${process.env.SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      };
  
      const {data} = await AxiosService.get(
        `${process.env.AUTH_URL}/file/hash/version/${searchTerm}`,
        res,
        config
      );
  
      const fileData = data.result;
  
      if (!fileData.version_id) {
        loggerInstance.error("No record in the table for the id", searchTerm);
  
        throw ResponseHelper.failureResponse(
          `No record in the table for the id=${searchTerm}`,
          null,
          res,
          404
        );
      }
  
      const { path, hash } = fileData;
      if (!path && !hash) {
        loggerInstance.error(
          "No data found for both path and hash with the id",
          searchTerm
        );
  
        throw ResponseHelper.failureResponse(
          `No data found for both path and hash with the id=${searchTerm}`,
          null,
          res,
          404
        );
      }
      loggerInstance.info("Able to get the file data", fileData);
      return fileData;
    } catch(e) {
      throw ResponseHelper.failureResponse(
        `No data found for both path and hash with the id=${searchTerm}`,
        null,
        res,
        404
      );
    }
  }

  public static async checkHashForAsset(req: any, searchTerm: any, res: any) {
    try {

      const config = {
        headers: {
          Authorization: `${process.env.SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      };
  
      const {data} = await AxiosService.get(
        `${process.env.AUTH_URL}/file/hash/version/hash/${searchTerm}`,
        res,
        config
      );
  
      const version = data.result;
      
      loggerInstance.info(
        "version response",
        data
      );

      if (version.id) {
        loggerInstance.error("Hash is Already Minted", searchTerm);
        
        await AssetHelper.assetCreationError(req.body.id, 100, 'Hash is already minted for the given asset - Duplicate Asset');

        throw ResponseHelper.failureResponse(
          `Hash is Already Minted`,
          null,
          res,
          409
        );
      }
      loggerInstance.info(
        "Hash has not been minted in the blockchain",
        searchTerm
      );
    } catch (error) {
      loggerInstance.error(
        "Error while trying to find the hash check for the asset",
        error
      );

      throw error;
    }
  }

  //to upadte the status using the myipr api
  public static async assetCreationError(asset: any,code:any, message: string | null) {
    try {

      let data = JSON.stringify({
        message: message ? message : "Error while minting the asset in the blockchain",
        timestamp: new Date(Date.now()).toISOString(),
        code: `${code}`,
      });

      let config = {
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };

      const response = await AxiosService.post(
        `${process.env.AUTH_URL}/file/version/${asset}/error`,
        data,
        config
      );
      
      loggerInstance.info("Successfully made the API to Myipr backend");
      return response;
    } catch (error) {
      loggerInstance.error(
        "Error while making a call to the Myipr backend",
        error
      );
      throw error;
    }
  }

  //to get the file information
  public static async FileVersion(searchTerm: any, res: any) {
    try {
      const config = {
        headers: {
          Authorization: `${process.env.SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      };
  
      const {data} = await AxiosService.get(
        `${process.env.AUTH_URL}/file/hash/version/${searchTerm}`,
        res,
        config
      );
  
      return data.result;
    } catch(e) {
      throw ResponseHelper.failureResponse(
        `File version not found for id ${searchTerm}`,
        null,
        res,
        404
      );
    }
  }

  public static async getUserInfo(req: any, res: any, userId: any) {
    try {
      const config = {
        headers: {
          Authorization: `${process.env.SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      };

      const response = await AxiosService.get(
        `${process.env.AUTH_URL}/user/profile/${userId}`,
        res,
        config
      );
        
      req["user"] = response.data;
      return response;
    } catch (error) {
      loggerInstance.error("Error in getting the user data");
      throw Error;
    }
  }

  public static async getUserInfoOnly(userId: any) {
    try {
      const config = {
        headers: {
          Authorization: `${process.env.SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      };

      const response = await AxiosService.get(
        `${process.env.AUTH_URL}/user/profile/${userId}`,
        {},
        config
      );
        
      return response.data;
    } catch (error) {
      loggerInstance.error("Error in getting the user data");
      throw Error;
    }
  }

  public static async touchFileVersion(versionId: any) {
    try {
      const config = {
        headers: {
          Authorization: `${process.env.SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      };

      const response = await AxiosService.post(
        `${process.env.AUTH_URL}/file/hashing/touch/${versionId}`,
        {},
        config
      );

      return response;
    } catch (error) {
      loggerInstance.error("Error in touching file version");
      throw Error;
    }
  }

  public static async updateFileVersion(versionId: any, data: any) {
    try {
      const config = {
        headers: {
          Authorization: `${process.env.SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      };

      const response = await AxiosService.post(
        `${process.env.AUTH_URL}/file/hash/version/${versionId}`,
        data,
        config
      );

      return response;
    } catch (error) {
      loggerInstance.error("Error in updating file version "+versionId);
      throw Error;
    }
  }
}
