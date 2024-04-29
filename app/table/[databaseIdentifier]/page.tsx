import { Suspense } from "react";
import { getTableData } from "./actions/get-table-data-action";
import { z } from "zod";
import { TableDisplayBodyWithFooter } from "./components/table-display-body";

export default function TableDisplay({
  params: { databaseIdentifier },
  searchParams,
}: {
  params: { databaseIdentifier: string };
  searchParams: unknown;
}) {
  let parsedSearchParams;
  try {
    parsedSearchParams = tableListPageSearchParamSchema.parse(searchParams);
  } catch (error) {
    throw new Error("Invalid search params", { cause: error });
  }

  const { password } = parsedSearchParams;

  return (
    <main className="flex flex-col">
      <Suspense fallback={<div className="w-full h-full p-4">Loading...</div>}>
        <header className="w-full bg-slate-600 px-4 py-2 text-slate-100">
          <h1>
            &apos;<b>{databaseIdentifier}</b>&apos; Database Tables
          </h1>
        </header>
        <TableDisplayBody
          databaseIdentifier={databaseIdentifier}
          databasePassword={password}
        />
      </Suspense>
    </main>
  );
}

async function TableDisplayBody({
  databaseIdentifier,
  databasePassword,
}: {
  databaseIdentifier: string;
  databasePassword: string;
}) {
  const rows = await getTableData({ databaseIdentifier, databasePassword });

  return (
    <TableDisplayBodyWithFooter
      tables={rows}
      databaseIdentifier={databaseIdentifier}
      databasePassword={databasePassword}
    />
  );
}

// #region Page URL Config

const tableListPageSearchParamSchema = z.object({
  password: z.string(),
});

type TableListPageSearchParams = z.infer<typeof tableListPageSearchParamSchema>;

export function buildTableListPageUrl({
  password,
  databaseIdentifier,
}: TableListPageSearchParams & { databaseIdentifier: string }) {
  const params = new URLSearchParams({
    password,
  });

  return `/table/${databaseIdentifier}?${params}`;
}

// #endregion
