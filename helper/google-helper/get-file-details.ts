import { GoogleDrive } from "../../external/google/google";

export class GetFileDetails {
    private googleDrive = new GoogleDrive();

    public async getFileDetails(accessToken: string, fileId: string) {
        try {
            return await this.googleDrive.getFileDetails(accessToken, fileId);
        } catch (error) {
            throw error
        }
    }
}