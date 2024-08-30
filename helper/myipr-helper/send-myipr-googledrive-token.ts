import axios from "axios";
import { MyIPR } from "../../external/myipr/myipr";

export class SendMyIPRGoogleDriveToken {
    private myIPR = new MyIPR();

    public async sendMyIPRGoogleDriveToken(tokens: any, userId: any) {
        try {
            const date = new Date(tokens.expiry_date);
            const timestamp = date.toISOString();

            const res = {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: timestamp,
                userId: userId,
                provider: 'google-drive',
                info: ''
            }
            return await this.myIPR.sendAccessToken(res);
        } catch (error) {
            throw error
        }
    }

}

