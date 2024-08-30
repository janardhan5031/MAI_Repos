import "dotenv/config";
import { QueryResult,PoolClient } from "pg";


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
    return pgPool;
  } catch (error) {
    console.log(error,"error while connecting to the server");
    throw error;
  }
};
export default connectPostgreSQL;
export { pgPool };

