import { TableSchemasDisplay } from "./table-schemas-display";

export default function TableDisplay({
  params: { tableName },
}: {
  params: { tableName: string };
}) {
  return (
    <main className="flex flex-col">
      <header className="w-full bg-slate-600 px-4 py-2 text-slate-100">
        <h1>
          &apos;<b>{tableName}</b>&apos; Table Schemas
        </h1>
      </header>
      <TableSchemasDisplay />
      <footer className="flex w-full bg-slate-800 px-4 py-2 justify-end">
        <button className="px-4 py-2 dark:bg-slate-500 rounded-md">
          Begin Migration
        </button>
      </footer>
    </main>
  );
}
