import { Dropbox } from "../../external/dropbox/dropbox";

export class GetDropboxAuthLink {
    private dropbox = new Dropbox()

    public async getAuthLink(userId: any) {
        try {
            return await this.dropbox.getAuthLink(userId);
        } catch (error) {
            throw error
        }
    }

}

