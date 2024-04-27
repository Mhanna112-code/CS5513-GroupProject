"use server";
import { Client, ClientConfig } from "pg";
import { DbSchemaResponseSchema } from "../schemas";
import { z } from "zod";

export async function getTableData(
  clientConfig: Pick<
    ClientConfig,
    "host" | "port" | "user" | "password" | "database"
  >
) {
  // Create connection
  const client = new Client({
    ...clientConfig,
    ssl: true,
  });
  // Connect to database server
  await client.connect();

  const res = await client.query(`
    SELECT * FROM pg_catalog.pg_tables
    WHERE schemaname = 'public';
  `);

  const rows = z.array(DbSchemaResponseSchema).parse(res.rows);

  client.end();

  return rows;
}
