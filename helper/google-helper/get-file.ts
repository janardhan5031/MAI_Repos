import { GoogleDrive } from "../../external/google/google";

export class GetFile {
    private googleDrive = new GoogleDrive();

    public getFile(accessToken: string, fileId: string, sizeInKB: number, fileName: string) {
        try {
            this.googleDrive.getFile(accessToken, fileId, sizeInKB, fileName);
        } catch (error) {
            throw error
        }
    }
}