"use server";
import { DatabaseMigrationService } from "@aws-sdk/client-database-migration-service";

/**
 * This function handles starting a replication task, and polling it until it is
 * complete
 */
export async function runReplicationTask({
  client,
  replicationTaskArn,
}: {
  client: DatabaseMigrationService;
  replicationTaskArn: string;
}) {
  await client.startReplicationTask({
    StartReplicationTaskType: "start-replication",
    ReplicationTaskArn: replicationTaskArn,
  });

  while (1) {
    const describeRes = await client.describeReplicationTasks({
      Filters: [{ Name: "replication-task-arn", Values: [replicationTaskArn] }],
    });

    const task = describeRes.ReplicationTasks?.[0];

    if (
      task &&
      task.Status === "stopped" &&
      task.StopReason?.toLowerCase().includes("finished")
    ) {
      return;
    }

    // Any task with 'fail' in it failed to run the migration
    if (!task || (task && task.Status?.toLowerCase().includes("fail"))) {
      console.error("Replication task failed!", {
        stopReason: task?.StopReason ?? "Task does not exist",
      });
      throw new Error("Replication task failed!", {
        cause: task?.StopReason ?? "Task does not exist",
      });
    }

    console.log("Migration task still running. Status:", task?.Status);
    await new Promise((res) => setTimeout(res, 10_000));
  }
}
