import "dotenv/config";
import { QueryResult,PoolClient } from "pg";
import { pgPool } from "../sql-helper/db-config";

export class SQLService {
  public static async query(
    sql: string,
    values?: any[]
  ): Promise<QueryResult<any>> {
    let client: PoolClient | null = null;;
    //sql connection
    try {
      client = await pgPool.connect();
      const result = await pgPool.query(sql, values);
      return result;
    } catch (error) {
      throw error;
    } finally{
      if (client) {
        client.release();
      }
    }
  }
}
