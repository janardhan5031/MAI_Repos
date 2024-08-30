import { Onedrive } from "../../external/onedrive/onedrive";

export class GetOnedriveFiles {
    private onedrive = new Onedrive()

    public async getOnedriveFiles(accessToken: any, query:any) {
        try {
            return await this.onedrive.getFilesList(accessToken, query);
        } catch (error) {
            throw error
        }
    }

}

