import {
  DBInstance,
  DescribeDBInstancesCommand,
  RDSClient,
} from "@aws-sdk/client-rds";
import { z } from "zod";

/**
 * This function fetches all of the information we need get about our source RDS database
 *
 * @param dbInstanceIdentifier
 * @returns
 */
export async function getRdsDatabaseDetails(dbInstanceIdentifier: string) {
  const rds = new RDSClient();

  const dbInstances = await rds.send(
    new DescribeDBInstancesCommand({
      DBInstanceIdentifier: dbInstanceIdentifier,
    })
  );

  const dbInstance = dbInstances.DBInstances?.[0];

  if (!dbInstance) throw new Error("Failed to find RDS VPC group");

  return getDbConfigFromDbInstance(dbInstance);
}

const dbInstanceSchema = z.object({
  Endpoint: z.object({
    Address: z.string(),
    Port: z.number(),
  }),
  DBName: z.string(),
  MasterUsername: z.string(),
  VpcSecurityGroups: z
    .array(
      z.object({
        status: z.string().optional(),
        VpcSecurityGroupId: z.string(),
      })
    )
    .min(1),
});

function getDbConfigFromDbInstance(dbInstance: DBInstance) {
  const parsedDbInstance = dbInstanceSchema.parse(dbInstance);

  return {
    host: parsedDbInstance.Endpoint.Address,
    port: parsedDbInstance.Endpoint.Port,
    database: parsedDbInstance.DBName,
    user: parsedDbInstance.MasterUsername,
    vpcSecurityGroup: parsedDbInstance.VpcSecurityGroups[0],
  } as const;
}
