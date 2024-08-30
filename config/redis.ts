import { createClient } from "redis";
import blueBird from "bluebird";
import "dotenv/config";

let redisConnection: any;

try {
  redisConnection = createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    },
    // password: process.env.REDIS_PASSWORD,
  });

  redisConnection.connect();
  redisConnection.on("error", (err: any) => {
    console.log("Error " + err);
  });
  redisConnection.on("connect", (msg: any) => {
    console.log("Redis connected");
    blueBird.promisifyAll(redisConnection);
  });
} catch (error) {
  console.error("[redis.connector][init][Error]: ", error);
  throw Error("failed to initialized redis");
}

export default redisConnection;
