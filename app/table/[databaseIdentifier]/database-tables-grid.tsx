"use client";

import { AgGridReact } from "ag-grid-react"; // AG Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the grid
import "ag-grid-community/styles/ag-theme-balham.css"; // Optional Theme applied to the grid
import { DbSchemaResponseType } from "./schemas";
import { forwardRef } from "react";

export const DatabaseTablesGrid = forwardRef<
  AgGridReact,
  {
    tables: DbSchemaResponseType[];
  }
>(({ tables }, ref) => {
  return (
    // wrapping container with theme & size
    <div
      className="ag-theme-balham-auto-dark"
      style={{ height: 200 }} // the grid will fill the size of the parent container
    >
      <AgGridReact
        ref={ref}
        rowData={tables.map((table) => ({
          tableName: table.tablename,
        }))}
        columnDefs={[
          {
            field: "tableName",
            headerName: "Table Name",
            checkboxSelection: true,
            headerCheckboxSelection: true,
          },
        ]}
        rowSelection="multiple"
      />
    </div>
  );
});

DatabaseTablesGrid.displayName = "DatabaseTablesDisplay";
