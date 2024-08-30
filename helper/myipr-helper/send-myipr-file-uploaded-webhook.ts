import axios from "axios";
import { MyIPR } from "../../external/myipr/myipr";

export class sendMyIPRFileUploadedWebhook {
    private myIPR = new MyIPR();

    public async sendMyIPRFileUploadedWebhook(path: string, hash?: string) {
        try {
            return await this.myIPR.sendMyIPRFileUploadedWebhook(path, hash);
        } catch (error) {
            throw error
        }
    }

}

