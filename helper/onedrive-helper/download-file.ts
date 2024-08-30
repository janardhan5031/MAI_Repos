import { Onedrive } from "../../external/onedrive/onedrive";

export class DownloadOnedriveFile {
    private onedrive = new Onedrive()

    public async downloadOnedriveFile(accessToken: any, query:any, userId: string, filePath: string) {
        try {
            return await this.onedrive.downloadFile(accessToken, query, userId, filePath);
        } catch (error) {
            throw error
        }
    }

    public async getFileDetails(accessToken: any, query:any) {
        try {
            return await this.onedrive.getFileDetails(accessToken, query);
        } catch (error) {
            throw error
        }
    }

}

