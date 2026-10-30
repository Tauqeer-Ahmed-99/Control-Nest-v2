import { drizzle, NodePgTransaction } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { relations } from "./relations";
import env from "@/env/vars";

const DATABASE_URL =
  env.variables.DB_ENV === "production"
    ? env.variables.PROD_DATABASE_URL
    : env.variables.DEV_DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const database = drizzle({ client: pool, relations });

export type DBTransaction = NodePgTransaction<typeof relations>;

export default database;
