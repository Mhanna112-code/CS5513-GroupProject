import { z } from "zod";

export const DbSchemaResponseSchema = z
  .object({
    tablename: z.string(),
  })
  .passthrough();

export type DbSchemaResponseType = z.infer<typeof DbSchemaResponseSchema>;
