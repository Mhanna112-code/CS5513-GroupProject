"use client";
import { runDatabaseMigration } from "../actions/migrate-database/run-migration";

export function StartMigrationButton({
  databaseIdentifier,
  databasePassword,
  tableNames,
}: {
  databaseIdentifier: string;
  databasePassword: string;
  tableNames: [string, ...string[]];
}) {
  return (
    <button
      className="px-4 py-2 dark:bg-slate-500 rounded-md"
      onClick={async () => {
        await runDatabaseMigration({
          rdsDatabaseInfo: {
            identifier: databaseIdentifier,
            password: databasePassword,
          },
          tableNames,
        });
      }}
    >
      Begin Migration
    </button>
  );
}
