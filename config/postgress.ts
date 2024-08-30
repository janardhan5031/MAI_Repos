import "dotenv/config";
import loggerInstance from "./winston";
const { Pool } = require("pg");
const pgConfig = {
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
};

const pgPool = new Pool(pgConfig);

//Postgress connection
const connectPostgreSQL = async () => {
  try {
    await pgPool.connect();
    loggerInstance.info("Connected to PostgreSQL");
    return pgPool;
  } catch (error) {
    console.log(error,"error while connecting to the server");
    loggerInstance.error("PostgreSQL connection error", error);
    throw error;
  }
};
export default connectPostgreSQL;
export { pgPool };
