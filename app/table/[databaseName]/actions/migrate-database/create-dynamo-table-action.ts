"use server";
import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";

/**
 * This helper function is used to create our DynamoDB table
 */
export async function createDynamoTable({ tableName }: { tableName: string }) {
  const dynamoDbClient = new DynamoDBClient();

  const createTableCommand: CreateTableCommand = new CreateTableCommand({
    TableName: tableName,
    AttributeDefinitions: [
      {
        AttributeName: "PK", // This is our general table PK, which can hold the PK for any type of data
        AttributeType: "S", // For simplicity, always a string
      },
    ],
    KeySchema: [
      {
        AttributeName: "PK",
        KeyType: "HASH", // Primary Key
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
    DeletionProtectionEnabled: false,
    TableClass: "STANDARD_INFREQUENT_ACCESS", // Hard coded to free-tier values
  });

  let newTableName: string | undefined;
  let newTableArn: string | undefined;
  try {
    const creationResult = await dynamoDbClient.send(createTableCommand);

    newTableName = creationResult.TableDescription?.TableName;
    newTableArn = creationResult.TableDescription?.TableArn;
  } catch (error) {
    console.error("Failed to create DynamoDB Table!", error);
    throw new Error("DynamoDB creation failed!");
  }

  while (1) {
    const { Table } = await dynamoDbClient.send(
      new DescribeTableCommand({ TableName: newTableName })
    );

    if (Table?.TableStatus === "ACTIVE") {
      // console.debug("Table available!");
      break;
    }

    // console.debug("DynamoDB table not ready...");
    await new Promise((res) => setTimeout(res, 5000));
    // console.debug("Checking status again");
  }

  return { tableName: newTableName, arn: newTableArn } as const;
}
