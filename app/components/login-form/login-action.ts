"use server";

import { Client } from "pg";
import { z } from "zod";

const ValuesSchema = z.object({
  user: z.string(),
  password: z.string(),
  port: z.preprocess((val) => Number(val), z.number()),
  host: z.string(),
  database: z.string(),
});

export async function loginAction(formValues: FormData) {
  // TODO Error handling
  const values = ValuesSchema.parse(Object.fromEntries(formValues.entries()));

  const client = new Client({
    ...values,
    ssl: true,
  });
  try {
    await client.connect();
  } catch (error) {
    console.error("Caught an error during connection attempt", error);
    return { success: false } as const;
  }

  await client.end();

  return { success: true, tableName: values.database, ...values } as const;
}
