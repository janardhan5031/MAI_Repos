import { GoogleDrive } from "../../external/google/google";

export class GetAuthLink {
    private googleDrive = new GoogleDrive()

    public async getAuthLink(userId: any) {
        try {
            return await this.googleDrive.getAuthLink(userId);
        } catch (error) {
            throw error
        }
    }

}

