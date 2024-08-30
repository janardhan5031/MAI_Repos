import { GoogleDrive } from "../../external/google/google";

export class ListFiles {
    private googleDrive = new GoogleDrive();

    public async getFilesList(accessToken: string, query: string | undefined) {
        try {
            return await this.googleDrive.getFilesList(accessToken, query);
        } catch (error) {
            throw error
        }
    }
}