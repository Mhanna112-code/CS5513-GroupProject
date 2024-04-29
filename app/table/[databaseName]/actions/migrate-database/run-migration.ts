"use server";
import { createDynamoTable } from "./create-dynamo-table-action";
import { Client } from "pg";
import { getRdsDatabaseDetails } from "./get-rds-database-details";
import { setupDmsReplicationTask } from "./dms/setup-dms-replication-task";
import { DatabaseMigrationService } from "@aws-sdk/client-database-migration-service";

export type SourceTableWithPrimaryKey = {
  tableName: string;
  schemaName: string;
  primaryKey: string;
};

async function getAttributesForTables(
  client: Client,
  tableNames: [string, ...string[]]
): Promise<SourceTableWithPrimaryKey[]> {
  const [{ rows: tableAttributes }, { rows: tablePrimaryKeys }] =
    await Promise.all([
      client.query<{ column_name: string; data_type: string }>(`
          SELECT DISTINCT column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND ${tableNames
            .map((tableName) => `table_name = '${tableName}'`)
            .join("\nOR ")}
        `),
      client.query<{
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
        `),
    ]);

  return tablePrimaryKeys.map(({ column_name, table_name }) => ({
    schemaName: "public",
    primaryKey: column_name,
    tableName: table_name,
  }));
}

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

  console.log(
    "Table creation successful!",
    dynamoDbTableName,
    dynamoDbTableArn
  );

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

  const attributesResult = await getAttributesForTables(
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

  console.log("Replication tasks set up successfully!");

  postgresClient.end();
}
