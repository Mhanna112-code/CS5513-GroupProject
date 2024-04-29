"use server";

import { DynamoDB, ScanCommand } from "@aws-sdk/client-dynamodb";

export async function fetchTableData(tableName: string) {
  const client = new DynamoDB();

  const allItems = await client.send(
    new ScanCommand({
      TableName: tableName,
      Limit: 10,
    })
  );

  if (!allItems.Items)
    throw new Error("Failed to fetch successfully created table data");

  return allItems.Items;
}
