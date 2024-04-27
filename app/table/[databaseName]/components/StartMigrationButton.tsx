"use client";
import { ClientConfig } from "pg";
import { runDatabaseMigration } from "../actions/migrate-database/run-migration";

export function StartMigrationButton({
  database,
  host,
  password,
  port,
  user,
}: Required<
  Pick<ClientConfig, "host" | "port" | "user" | "password" | "database">
>) {
  return (
    <button
      className="px-4 py-2 dark:bg-slate-500 rounded-md"
      onClick={async () => {
        await runDatabaseMigration({
          database,
          host,
          password,
          port,
          user,
        });
      }}
    >
      Begin Migration
    </button>
  );
}
