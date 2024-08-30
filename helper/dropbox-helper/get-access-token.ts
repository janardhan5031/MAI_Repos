import { Dropbox } from "../../external/dropbox/dropbox";
import { MyIPR } from "../../external/myipr/myipr";

export class GetDropboxAccessToken {
    private dropbox = new Dropbox()
    private myIPR = new MyIPR()

    public async getAccessToken(code: any, userId: any) {
        try {
            const tokens = await this.dropbox.getAccessToken(code, userId);
            
            const accessToken = tokens.access_token
            const refreshToken = tokens.refresh_token
            
            const date = new Date();
            const secondsToAdd = tokens.expires_in
            date.setSeconds(date.getSeconds() + secondsToAdd);
            const timestamp = date.toISOString();

            // const profile = await this.dropbox.getUserProfile(accessToken)
            const res = {
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: timestamp,
                provider: 'dropbox',
                userId: userId,
                info: JSON.stringify({
                    // account_id: profile.account_id,
                    // name: profile.name.display_name,
                    // email: profile.email,
                })
            }

            await this.myIPR.sendAccessToken(res)
        } catch (error) {
            throw error
        }
    }

}

