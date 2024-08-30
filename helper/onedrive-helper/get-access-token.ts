import { MyIPR } from "../../external/myipr/myipr";
import { Onedrive } from "../../external/onedrive/onedrive";

export class GetOnedriveAccessToken {
    private onedrive = new Onedrive()
    private myIPR = new MyIPR()

    public async getAccessToken(code: any, userId: any) {
        try {
            const tokens = await this.onedrive.getAccessToken(code, userId);
            console.log("🚀 ~ file: get-access-token.ts:11 ~ GetOnedriveAccessToken ~ getAccessToken ~ tokens:", tokens)
            
            const accessToken = tokens.access_token
            console.log("🚀 ~ file: get-access-token.ts:14 ~ GetOnedriveAccessToken ~ getAccessToken ~ accessToken:", accessToken)

            const date = new Date();
            const secondsToAdd = tokens.expires_in
            date.setSeconds(date.getSeconds() + secondsToAdd);
            const timestamp = date.toISOString();

            // const profile = await this.onedrive.getUserProfile(accessToken)
            // console.log("🚀 ~ file: get-access-token.ts:21 ~ GetOnedriveAccessToken ~ getAccessToken ~ profile:", profile)
            const res = {
                access_token: accessToken,
                refresh_token: '',
                expires_at: timestamp,
                provider: 'onedrive',
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

