import axios from 'axios';

const baseURL = process.env.MYIPR_BASE_URL;

export class MyIPR {

    async sendAccessToken(res: any) {
        try {
            const body = res

            const {data} = await axios.post(`${baseURL}user/save-drive`, body, {
                headers: {
                    "Content-Type": "application/json",
                }
            });
    
            return data;
        } catch(error) {
            console.log("🚀 ~ file: myipr.ts:19 ~ MyIPR ~ sendAccessToken ~ error:", error)
            
            throw error;
        }
    }


    async sendHashGenerateEvent(accessToken: string, userId: number) {
        try {
            const body = {
                access_token: accessToken,
                userId: userId,
                provider: 'google-drive'
            }

            const {data} = await axios.post(`${baseURL}user/save-drive`, body, {
                headers: {
                    "Content-Type": "application/json",
                }
            });
    
            return data;
        } catch(error) {
            throw error;
        }
    }

    async sendMyIPRFileUploadedWebhook(path: string, hash?: string) {
        try {
            const body = {
                path: path,
                hash: hash
            }
            console.log("🚀 ~ file: myipr.ts:52 ~ MyIPR ~ sendMyIPRFileUploadedWebhook ~ body:", body)

            const {data} = await axios.post(`${baseURL}file/upload-completed`, body, {
                headers: {
                    "Content-Type": "application/json",
                }
            });
            console.log("🚀 ~ file: myipr.ts:59 ~ MyIPR ~ sendMyIPRFileUploadedWebhook ~ data:", data.response.data.message)
            return data;
        } catch(error) {
            throw error;
        }
    }
}