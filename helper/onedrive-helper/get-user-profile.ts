import { Onedrive } from "../../external/onedrive/onedrive";

export class GetOnedriveUserProfile {
    private onedrive = new Onedrive()

    public async getUserProfile(accessToken: string) {
        try {
            return await this.onedrive.getUserProfile(accessToken);
        } catch (error) {
            throw error
        }
    }

}

