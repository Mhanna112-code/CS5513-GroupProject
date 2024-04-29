"use client";

import { AgGridReact } from "ag-grid-react"; // AG Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the grid
import "ag-grid-community/styles/ag-theme-balham.css"; // Optional Theme applied to the grid
import { DbSchemaResponseType } from "./schemas";

export function TableSchemasDisplay({
  schemas,
}: {
  schemas: DbSchemaResponseType[];
}) {
  return (
    // wrapping container with theme & size
    <div
      className="ag-theme-balham-auto-dark"
      style={{ height: 200 }} // the grid will fill the size of the parent container
    >
      <AgGridReact
        rowData={schemas.map((schema) => ({
          tableName: schema.tablename,
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
        onSelectionChanged={(currentState) => {
          console.log(currentState.api.getSelectedRows());
        }}
      />
    </div>
  );
}
