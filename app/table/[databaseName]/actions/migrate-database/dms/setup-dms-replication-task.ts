"use server";
import {
  AccessDeniedFault,
  CreateEndpointCommand,
  CreateReplicationInstanceCommand,
  CreateReplicationTaskCommand,
  DatabaseMigrationService,
  DescribeReplicationInstancesCommand,
  DescribeReplicationTasksCommand,
} from "@aws-sdk/client-database-migration-service";
import {
  AttachRolePolicyCommand,
  CreateRoleCommand,
  EntityAlreadyExistsException,
  IAMClient,
} from "@aws-sdk/client-iam";
import { SourceTableWithPrimaryKey } from "../run-migration";

/**
 * This function handles all of the setup for our DMS Replication Task
 *
 * @returns Replication Task ARN
 */
export async function setupDmsReplicationTask({
  client,
  vpcSecurityGroupIds,
  dynamoDb,
  sourceConfig,
  sourceAttributes,
}: {
  vpcSecurityGroupIds: string[];
  client: DatabaseMigrationService;
  dynamoDb: {
    tableArn: string;
    tableName: string;
  };
  sourceConfig: {
    host: string;
    port: number;
    user: string;
    password: string;
    databaseName: string;
  };
  sourceAttributes: SourceTableWithPrimaryKey[];
}) {
  console.log("Setting up needed permissions...");

  const iamClient = new IAMClient();

  /**
   * Our task needs 2 sets of permissions:
   *
   * 1. Access to DynamoDB to modify, create tables, and write into existing ones.
   *    For more information on minimum specs, see [here](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Target.DynamoDB.html#CHAP_Target.DynamoDB.Prerequisites).
   * 2. Permissions for DMS to do its thing
   */
  const [dynamoDbServiceAccessArn] = await Promise.all([
    createDynamoDBServiceAccessRole(iamClient),
    grantDmsAccessPermissions(iamClient),
  ]);

  console.log("Permissions setup successfully!");

  console.log("Creating Replication Instance");

  const replicationInstanceArn = await setupReplicationInstance(
    client,
    vpcSecurityGroupIds
  );

  console.log("Replication Instance created!");

  console.log("Creating source endpoint...");

  const sourceEndpointArn = await setupSourceEndpoint(client, sourceConfig);

  console.log("Source endpoint created!");

  console.log("Creating target endpoint...");

  const targetEndpointArn = await setupTargetEndpoint(client, {
    serviceAccessRoleArn: dynamoDbServiceAccessArn,
    tableName: dynamoDb.tableName,
  });

  console.log("Target endpoint created!");

  // We need to make sure the replication instance is good to go before we try to create the task.
  // Otherwise, task creation will fail.
  while (1) {
    const replicationInstanceStatusRes = await client.send(
      new DescribeReplicationInstancesCommand({
        Filters: [
          {
            Name: "replication-instance-arn",
            Values: [replicationInstanceArn],
          },
        ],
      })
    );

    const replicationInstance =
      replicationInstanceStatusRes.ReplicationInstances?.find(
        (replInst) => replInst.ReplicationInstanceArn === replicationInstanceArn
      );

    if (!replicationInstance?.ReplicationInstanceStatus) {
      console.error(
        "Replication instance status not found! ARN:",
        replicationInstanceArn
      );
      throw new Error("Failed to poll replication instance");
    }

    console.debug(
      "Replication instance creation status:",
      replicationInstance.ReplicationInstanceStatus
    );

    if (replicationInstance.ReplicationInstanceStatus === "available") {
      break;
    }

    await new Promise((res) => setTimeout(res, 10_000));
  }

  console.log("Replication instance available!");

  console.log("Creating replication task command...");

  // Replication Task Setup. This is what actually drives the migration algorithm
  const { ReplicationTask } = await client.send(
    new CreateReplicationTaskCommand({
      TableMappings: JSON.stringify(
        createTableMappingForTablesWithAttributes({
          dynamoDbTableName: dynamoDb.tableName,
          tablesWithAttributes: sourceAttributes,
        })
      ),
      ReplicationInstanceArn: replicationInstanceArn,
      ReplicationTaskIdentifier: "rds-to-ddb-replication-task",
      MigrationType: "full-load", // This doesn't take changing data into consideration, which would likely be needed in production environments. Hard coded for cost efficiency
      SourceEndpointArn: sourceEndpointArn,
      TargetEndpointArn: targetEndpointArn,
    })
  );

  const replicationTaskArn = ReplicationTask?.ReplicationTaskArn;

  if (!replicationTaskArn)
    throw new Error(
      "Failed to get valid replication task arn! We likely have set everything up but the ReplicationTask itself"
    );

  // We need to wait for the replication task to be created before we call this work done
  while (1) {
    const replicationTaskDescriptionRes = await client.send(
      new DescribeReplicationTasksCommand({
        Filters: [
          { Name: "replication-task-arn", Values: [replicationTaskArn] },
        ],
      })
    );

    if (
      replicationTaskDescriptionRes.ReplicationTasks?.[0].Status === "ready"
    ) {
      break;
    }
  }

  console.log("Replication task command created!");

  return replicationTaskArn;
}

/**
 * This function implements our migration algorithm at the DMS rule level
 */
function createTableMappingForTablesWithAttributes({
  dynamoDbTableName,
  tablesWithAttributes,
}: {
  dynamoDbTableName: string;
  tablesWithAttributes: SourceTableWithPrimaryKey[];
}) {
  return {
    rules: [
      ...tablesWithAttributes
        .map((table, idx) => {
          const baseIdx = idx * 2;

          const objectLocator = {
            "schema-name": table.schemaName,
            "table-name": table.tableName,
          } as const;

          return [
            {
              "rule-type": "selection",
              "rule-id": baseIdx,
              "rule-name": baseIdx,
              "object-locator": objectLocator,
              "rule-action": "explicit",
            },
            {
              "rule-type": "object-mapping",
              "rule-id": baseIdx + 1,
              "rule-name": baseIdx + 1,
              "rule-action": "map-record-to-record",
              "object-locator": objectLocator,
              "target-table-name": dynamoDbTableName,
              "mapping-parameters": {
                "partition-key-name": "PK",
                "attribute-mappings": [
                  {
                    "target-attribute-name": "PK",
                    "attribute-type": "scalar",
                    "attribute-sub-type": "string",
                    value: `#${table.tableName.toUpperCase()}_\${${
                      table.primaryKey
                    }}`,
                  },
                ],
              },
            },
          ];
        })
        .flat(1),
    ],
  } as const;
}

/**
 * This helper function handles creating the `dms-vpc-role`, a role DMS will look for when attempting to
 * create the ReplicationInstance. It will error loudly without it.
 *
 * This role needs the `AmazonDMSVPCManagementRole`s Policy.
 */
async function grantDmsAccessPermissions(iamClient: IAMClient) {
  try {
    await iamClient.send(
      new CreateRoleCommand({
        // This RoleName can not change - AWS DMS will try to assign this to itself automatically
        RoleName: "dms-vpc-role",
        AssumeRolePolicyDocument: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: "dms.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            },
          ],
        }),
      })
    );
  } catch (error) {
    // We want to ignore this error - if this is thrown, we can assume that we have the needed perms!
    if (!(error instanceof EntityAlreadyExistsException)) {
      throw error;
    }
  }

  await iamClient.send(
    new AttachRolePolicyCommand({
      // We need to create a dms-vpc-role (CreateReplicationInstanceCommand tries to invoke it)
      RoleName: "dms-vpc-role",
      // This is a default AWS policy we want to make sure this role gets
      PolicyArn:
        "arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole",
    })
  );
}

/**
 * This helper function creates the DynamoDB Service Access role needed during source target generation
 */
async function createDynamoDBServiceAccessRole(iamClient: IAMClient) {
  const roleCreationResponse = await iamClient.send(
    new CreateRoleCommand({
      // This RoleName can not change - AWS DMS will try to assign this to itself automatically
      RoleName: "dms-ddb-access-role",
      AssumeRolePolicyDocument: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "",
            Effect: "Allow",
            Principal: {
              Service: "dms.amazonaws.com",
            },
            Action: "sts:AssumeRole",
          },
        ],
      }),
    })
  );

  await iamClient.send(
    new AttachRolePolicyCommand({
      RoleName: "dms-ddb-access-role",
      // This is a default AWS policy we want to make sure this role gets. In a production environment, we might
      // define a more restrictive IAM role here.
      PolicyArn: "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
    })
  );

  if (!roleCreationResponse.Role?.Arn)
    throw new Error("Failed to setup DDB access role");

  return roleCreationResponse.Role.Arn;
}

/**
 * This function handles setting up the replication instance, and doing some minor error handling for
 * robustness
 */
async function setupReplicationInstance(
  dmsClient: DatabaseMigrationService,
  vpcSecurityGroupIds: string[]
) {
  const createReplicationInstanceCommand = new CreateReplicationInstanceCommand(
    {
      ReplicationInstanceIdentifier: "rds-to-ddb-replication-example",
      ReplicationInstanceClass: "dms.t2.micro",
      AllocatedStorage: 50,
      VpcSecurityGroupIds: vpcSecurityGroupIds,
      MultiAZ: false,
      PubliclyAccessible: true,
    }
  );

  let replicationInstance;
  try {
    const { ReplicationInstance } = await dmsClient.send(
      createReplicationInstanceCommand
    );

    replicationInstance = ReplicationInstance;
  } catch (error) {
    // There's a known "feature" with AWS IAM where this will fail once, then succeed if immediately tried
    // again... so that's what we're doing here
    if (error instanceof AccessDeniedFault) {
      // Wait 5s, then retry
      await new Promise((res) => setTimeout(res, 5000));

      // console.debug("Got access denied, retrying...");
      const { ReplicationInstance } = await dmsClient.send(
        createReplicationInstanceCommand
      );

      console.log("Retry successful!");

      replicationInstance = ReplicationInstance;
    } else {
      throw error;
    }
  }

  if (!replicationInstance?.ReplicationInstanceArn)
    throw new Error(
      "Failed to get replicationInstanceArn for successful replication instance setup"
    );

  return replicationInstance?.ReplicationInstanceArn;
}

/**
 * This function handles creating our RDS Source Endpoint
 */
async function setupSourceEndpoint(
  client: DatabaseMigrationService,
  sourceConfig: {
    host: string;
    port: number;
    user: string;
    password: string;
    databaseName: string;
  }
) {
  const sourceEndpointRes = await client.send(
    new CreateEndpointCommand({
      EndpointType: "source",
      EngineName: "postgres",
      EndpointIdentifier: "rds-source-dms-endpoint",
      ServerName: sourceConfig.host,
      Port: sourceConfig.port,
      Username: sourceConfig.user,
      Password: sourceConfig.password,
      SslMode: "require",
      DatabaseName: sourceConfig.databaseName,
    })
  );

  const sourceEndpointArn = sourceEndpointRes.Endpoint?.EndpointArn;

  if (!sourceEndpointArn)
    throw new Error(
      "Failed to get sourceEndpointArn for successful source endpoint setup"
    );

  return sourceEndpointArn;
}

/**
 * This function handles setting up our DynamoDB Target Endpoint
 */
async function setupTargetEndpoint(
  dmsClient: DatabaseMigrationService,
  dynamoDb: {
    serviceAccessRoleArn: string;
    tableName: string;
  }
) {
  // Target Endpoint Setup
  const targetEndpointRes = await dmsClient.send(
    new CreateEndpointCommand({
      EndpointType: "target",
      EngineName: "dynamodb",
      EndpointIdentifier: "dynamo-db-target-dms-endpoint",
      DynamoDbSettings: {
        ServiceAccessRoleArn: dynamoDb.serviceAccessRoleArn,
      },
    })
  );

  const targetEndpointArn = targetEndpointRes.Endpoint?.EndpointArn;

  if (!targetEndpointArn)
    throw new Error(
      "Failed to get targetEndpointArn for successful target endpoint setup"
    );

  return targetEndpointArn;
}
