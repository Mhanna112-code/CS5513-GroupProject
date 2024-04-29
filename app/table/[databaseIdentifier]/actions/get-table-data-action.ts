"use server";
import { Client, ClientConfig } from "pg";
import { DbSchemaResponseSchema } from "../schemas";
import { z } from "zod";
import { getRdsDatabaseDetails } from "./migrate-database/get-rds-database-details";

export async function getTableData({
  databaseIdentifier,
  databasePassword,
}: {
  databaseIdentifier: string;
  databasePassword: string;
}) {
  const dbConfig = await getRdsDatabaseDetails(databaseIdentifier);
  // Create connection
  const client = new Client({
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: databasePassword,
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
