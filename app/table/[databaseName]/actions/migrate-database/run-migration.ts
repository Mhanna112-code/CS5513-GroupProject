"use server";
import { AttributeDefinition } from "@aws-sdk/client-dynamodb";
import { createDynamoTable } from "./create-dynamo-table-action";
import { Client, ClientConfig } from "pg";

type DynamoDbTableCreationAttribute = AttributeDefinition & {
  /**
   * Determines whether or not this attribute is a primary key
   */
  IsPrimary: boolean;
};

async function getAttributesForTables(
  client: Client,
  tableNames: [string, ...string[]]
) {
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
      client.query<{ column_name: string }>(`SELECT c.column_name
          FROM information_schema.key_column_usage AS c
          LEFT JOIN information_schema.table_constraints AS t
          ON t.constraint_name = c.constraint_name
          WHERE (${tableNames
            .map((tableName) => `t.table_name = '${tableName}'`)
            .join("\nOR ")}) 
            AND t.constraint_type = 'PRIMARY KEY';
        `),
    ]);

  return tableAttributes.map(
    (attribute) =>
      ({
        ...attribute,
        isPrimary: !!tablePrimaryKeys.find(
          (key) => key.column_name === attribute.column_name
        ),
      } as const)
  );
}

export async function runDatabaseMigration(
  clientConfig: Required<
    Pick<ClientConfig, "host" | "port" | "user" | "password" | "database">
  >
) {
  // Create connection
  const client = new Client({
    ...clientConfig,
    ssl: true,
  });
  // Connect to database server
  await client.connect();

  const attributesResult = await getAttributesForTables(client, [
    "customers",
    "suppliers",
  ]);

  client.end();

  const tableId = await createDynamoTable({
    tableName: clientConfig.database,
  });

  console.log("Table creation successful!", tableId);

  // This map handles converting our SQL column types to their corresponding Dynamo definition.
  // It also handles de-duplicating columns which are duplicated
  const dynamoDbAttributes: DynamoDbTableCreationAttribute[] =
    attributesResult.reduce<DynamoDbTableCreationAttribute[]>(
      (acc, attribute) => {
        const baseNewAttribute = {
          AttributeName: attribute.column_name,
          IsPrimary: attribute.isPrimary,
        };

        const existingAttribute = acc.find(
          (val) => val.AttributeName === attribute.column_name
        );

        if (existingAttribute) {
          if (
            existingAttribute.AttributeType ===
            getDynamoDbAttributeTypeFromPostgreSQLType(attribute.data_type)
          ) {
            // If the data types are the same, we'll omit adding this new version to the array
            return acc;
          }

          // Filter out the existing column if the data types are not the same (in this case, we'll just default to a string)
          return [
            ...acc.filter((val) => val.AttributeName !== attribute.column_name),
            // We should probably let the user determine what type of data this is... but we'll default to string.
            // This should capture everything.
            { ...baseNewAttribute, AttributeType: "S" } as const,
          ];
        }

        return [
          ...acc,
          {
            ...baseNewAttribute,
            AttributeType: getDynamoDbAttributeTypeFromPostgreSQLType(
              attribute.data_type
            ),
          },
        ];
      },
      []
    );
}

/**
 * This helper function takes a SQL data_type and converts it to a Dynamo one
 */
function getDynamoDbAttributeTypeFromPostgreSQLType(
  dataType: string
): AttributeDefinition["AttributeType"] {
  switch (dataType) {
    case "numeric":
    case "integer":
      return "N";
    case "text":
    case "character varying":
    default:
      return "S";
  }
}
