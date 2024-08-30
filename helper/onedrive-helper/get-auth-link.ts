import { Onedrive } from "../../external/onedrive/onedrive";

export class GetOnedriveAuthLink {
    private onedrive = new Onedrive()

    public async getAuthLink(userId: any) {
        try {
            return await this.onedrive.getAuthLink(userId);
        } catch (error) {
            throw error
        }
    }

}

