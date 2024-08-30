import { GoogleDrive } from "../../external/google/google";
import { SendMyIPRGoogleDriveToken } from "../myipr-helper/send-myipr-googledrive-token";

export class GetAccessToken {
    private googleDrive = new GoogleDrive()
    private sendMyiprGoogleDrivetoken = new SendMyIPRGoogleDriveToken();

    public async getAccessToken(code: any, userId: any) {
        try {
            const tokens = await this.googleDrive.getAccessToken(code);
            
            if(tokens.access_token) {
                // save token details in the myipr database
                await this.sendMyiprGoogleDrivetoken.sendMyIPRGoogleDriveToken(tokens, userId);
            }
            
            return {"tokens": tokens, "user_id": userId}
        } catch (error) {
            throw error
        }
    }

}

