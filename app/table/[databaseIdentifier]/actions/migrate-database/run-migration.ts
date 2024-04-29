"use server";
import { createDynamoTable } from "./create-dynamo-table-action";
import { Client } from "pg";
import { getRdsDatabaseDetails } from "./get-rds-database-details";
import { setupDmsReplicationTask } from "./dms/setup-dms-replication-task";
import { DatabaseMigrationService } from "@aws-sdk/client-database-migration-service";
import { runReplicationTask } from "./dms/run-replication-task";

export type SourceTableWithPrimaryKey = {
  tableName: string;
  schemaName: string;
  primaryKey: string;
};
/**
 * This function is our main database migration coordinator. It handles coordinating every
 * step of the migration process:
 *
 * 1. Creating the DynamoDB table based on the existing tables'RDS data
 * 2. Setting up the DMS replication task
 * 3. Starting the DMS replication task
 */
export async function runDatabaseMigration({
  rdsDatabaseInfo,
  tableNames,
}: {
  rdsDatabaseInfo: {
    identifier: string;
    password: string;
  };
  tableNames: [string, ...string[]];
}) {
  const dbConfig = await getRdsDatabaseDetails(rdsDatabaseInfo.identifier);

  console.log("Creating DynamoDB table, please wait....");

  const { tableName: dynamoDbTableName, arn: dynamoDbTableArn } =
    await createDynamoTable({
      tableName: dbConfig.database,
    });

  if (!dynamoDbTableArn || !dynamoDbTableName)
    throw new Error("Failed to get DynamoDB table details");

  console.log("Table creation successful!");

  const dmsClient = new DatabaseMigrationService();

  const postgresClient = new Client({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: rdsDatabaseInfo.password,
    database: dbConfig.database,
    ssl: true,
  });

  await postgresClient.connect();

  const attributesResult = await getPrimaryKeysForTables(
    postgresClient,
    tableNames
  );

  const replicationTaskArn = await setupDmsReplicationTask({
    client: dmsClient,
    vpcSecurityGroupIds: [dbConfig.vpcSecurityGroup.VpcSecurityGroupId],
    dynamoDb: {
      tableArn: dynamoDbTableArn,
      tableName: dynamoDbTableName,
    },
    sourceConfig: {
      host: dbConfig.host,
      password: rdsDatabaseInfo.password,
      port: dbConfig.port,
      user: dbConfig.user,
      databaseName: dbConfig.database,
    },
    sourceAttributes: attributesResult,
  });

  console.log("Replication task set up successfully!");

  console.log("===Starting the Migration===");

  await runReplicationTask({
    client: dmsClient,
    replicationTaskArn,
  });

  console.log("===Migration Complete!===");

  postgresClient.end();

  return { dynamoDbTableName };
}

async function getPrimaryKeysForTables(
  client: Client,
  tableNames: [string, ...string[]]
): Promise<SourceTableWithPrimaryKey[]> {
  const { rows: tablePrimaryKeys } = await client.query<{
    column_name: string;
    table_name: string;
  }>(`SELECT c.column_name, t.table_name
      FROM information_schema.key_column_usage AS c
      LEFT JOIN information_schema.table_constraints AS t
      ON t.constraint_name = c.constraint_name
      WHERE (${tableNames
        .map((tableName) => `t.table_name = '${tableName}'`)
        .join("\nOR ")}) 
        AND t.constraint_type = 'PRIMARY KEY';
    `);

  return tablePrimaryKeys.map(({ column_name, table_name }) => ({
    schemaName: "public",
    primaryKey: column_name,
    tableName: table_name,
  }));
}
