"use server";

import { getRdsDatabaseDetails } from "@/app/table/[databaseIdentifier]/actions/migrate-database/get-rds-database-details";
import { Client } from "pg";
import { z } from "zod";

const ValuesSchema = z.object({
  databaseIdentifier: z.string().min(1),
  password: z.string().min(1),
});

export async function loginAction(formValues: FormData) {
  let values;
  try {
    values = ValuesSchema.parse(Object.fromEntries(formValues.entries()));
  } catch (error) {
    console.error("Invalid login credentials", error);
    return { success: false, reason: "Login form invalid" } as const;
  }

  const rdsDatabaseDetails = await getRdsDatabaseDetails(
    values.databaseIdentifier
  );

  const client = new Client({
    host: rdsDatabaseDetails.host,
    port: rdsDatabaseDetails.port,
    database: rdsDatabaseDetails.database,
    user: rdsDatabaseDetails.user,
    password: values.password,
    ssl: true,
  });
  try {
    await client.connect();
  } catch (error) {
    console.error("Caught an error during connection attempt", error);
    return { success: false, reason: "Failed to connect to DB" } as const;
  }

  await client.end();

  return { success: true, ...values } as const;
}
