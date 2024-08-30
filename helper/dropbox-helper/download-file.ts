import { Dropbox } from "../../external/dropbox/dropbox";

export class DownloadDropboxFile {
    private dropbox = new Dropbox()

    public async getMetadata(accessToken: any, path: string, userId: string) {
        try {
            return await this.dropbox.getMetadata(accessToken, path, userId);
        } catch (error) {
            throw error
        }
    }
    
    public async downloadFile(accessToken: any, path: string, userId: string, savePath: string) {
        try {
            return await this.dropbox.downloadFile(accessToken, path, userId, savePath);
        } catch (error) {
            throw error
        }
    }

    public async getFolders(accessToken: any) {
        try {
            return await this.dropbox.uploadMyiprArchive(accessToken, '', 'test name');
        } catch (error) {
            throw error
        }
    }

}

