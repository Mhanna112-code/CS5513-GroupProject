import { ClientConfig } from "pg";
import { TableSchemasDisplay } from "../table-schemas-display";
import { forwardRef } from "react";
import { getTableData } from "../get-table-data-action";
import { AgGridReact } from "ag-grid-react";

export const TableDisplayBody = forwardRef<
  AgGridReact,
  Pick<ClientConfig, "host" | "port" | "user" | "password" | "database">
>(async (clientConfig, ref) => {
  const rows = await getTableData(clientConfig);

  return <TableSchemasDisplay ref={ref} schemas={rows} />;
});

TableDisplayBody.displayName = "TableDisplayBody";
