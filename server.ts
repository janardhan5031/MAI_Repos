import 'dotenv/config'
import app from "./config/app";
const PORT = Number(process.env.PORT);

app.listen(PORT, async () => {
    try {
        console.error("Server Started")
    } catch (error) {
        throw error;
    }
});