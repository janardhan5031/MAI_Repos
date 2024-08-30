import path from "path";
import fs from "fs";
import loggerInstance from "../config/winston";

export class FileHelper {
  //to delete the file from ssd
  public static async deletefile(fileName: string) {
    try {
      const filePath = path.join(__dirname, "../../", fileName);

      if (fs.existsSync(filePath)) {
        // Delete the file
        fs.unlinkSync(filePath);

        loggerInstance.info("Deleted the file from SSD", fileName);
        return { filedeleted: true };
      }
    } catch (error) {
      loggerInstance.error("Error in deleting the file", error);
    }
  }
}
