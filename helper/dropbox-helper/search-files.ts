import { Dropbox } from "../../external/dropbox/dropbox";

export class GetDropboxFiles {
    private dropbox = new Dropbox()

    public async getDropboxFiles(accessToken: any, query:any) {
        try {
            return await this.dropbox.getFilesList(accessToken, query);
        } catch (error) {
            throw error
        }
    }

}

