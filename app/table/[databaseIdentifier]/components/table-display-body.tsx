"use client";
import { DatabaseTablesGrid } from "../database-tables-grid";
import { StartMigrationButton } from "../components/start-migration-button";
import { DbSchemaResponseType } from "../schemas";
import type { AgGridReact } from "ag-grid-react";
import { useRef } from "react";
import { runDatabaseMigration } from "../actions/migrate-database/run-migration";
import { useRouter } from "next/navigation";
import { createSuccessPageUrl } from "@/app/[dynamoDbTableName]/success/page";

export function TableDisplayBodyWithFooter({
  tables,
  databaseIdentifier,
  databasePassword,
}: {
  tables: DbSchemaResponseType[];
  databaseIdentifier: string;
  databasePassword: string;
}) {
  const tableGridRef = useRef<AgGridReact>(null);

  const router = useRouter();

  return (
    <>
      <DatabaseTablesGrid ref={tableGridRef} tables={tables} />
      <footer className="flex w-full bg-slate-800 px-4 py-2 justify-end">
        <StartMigrationButton
          onClick={async () => {
            const selectedTables = tableGridRef.current?.api
              .getSelectedRows()
              ?.map((table) => table.tableName);

            if (!selectedTables?.[0]) return;

            console.log("Selected tables", selectedTables);

            const { dynamoDbTableName } = await runDatabaseMigration({
              rdsDatabaseInfo: {
                identifier: databaseIdentifier,
                password: databasePassword,
              },
              tableNames: selectedTables as [string, ...string[]],
            });

            router.push(createSuccessPageUrl(dynamoDbTableName));
          }}
        />
      </footer>
    </>
  );
}
