import { ClientConfig } from "pg";
import { TableSchemasDisplay } from "./table-schemas-display";
import { Suspense } from "react";
import { getTableData } from "./get-table-data-action";
import { z } from "zod";

export default function TableDisplay({
  params: { databaseName },
  searchParams,
}: {
  params: { databaseName: string };
  searchParams: unknown;
}) {
  let parsedSearchParams;
  try {
    parsedSearchParams = tableListPageSearchParamSchema.parse(searchParams);
  } catch (error) {
    throw new Error("Invalid search params", { cause: error });
  }

  const { host, password, port, user } = parsedSearchParams;

  return (
    <main className="flex flex-col">
      <header className="w-full bg-slate-600 px-4 py-2 text-slate-100">
        <h1>
          &apos;<b>{databaseName}</b>&apos; Database Tables
        </h1>
      </header>
      <Suspense fallback={<div className="w-full h-full p-4">Loading...</div>}>
        <TableDisplayBody
          database={databaseName}
          host={host}
          port={port}
          user={user}
          password={password}
        />
      </Suspense>
      <footer className="flex w-full bg-slate-800 px-4 py-2 justify-end">
        <button className="px-4 py-2 dark:bg-slate-500 rounded-md">
          Begin Migration
        </button>
      </footer>
    </main>
  );
}

async function TableDisplayBody(
  clientConfig: Pick<
    ClientConfig,
    "host" | "port" | "user" | "password" | "database"
  >
) {
  const rows = await getTableData(clientConfig);

  return <TableSchemasDisplay schemas={rows} />;
}

// #region Page URL Config

const tableListPageSearchParamSchema = z.object({
  host: z.string(),
  port: z.preprocess((val) => Number(val), z.number()),
  user: z.string(),
  password: z.string(),
});

type TableListPageSearchParams = z.infer<typeof tableListPageSearchParamSchema>;

export function buildTableListPageUrl({
  host,
  port,
  user,
  password,
  databaseName,
}: TableListPageSearchParams & { databaseName: string }) {
  const params = new URLSearchParams({
    host,
    port: port.toString(),
    user,
    password,
  });

  return `/table/${databaseName}?${params}`;
}

// #endregion
