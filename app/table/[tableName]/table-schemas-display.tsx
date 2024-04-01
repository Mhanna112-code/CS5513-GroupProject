"use client";

import { AgGridReact } from "ag-grid-react"; // AG Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the grid
import "ag-grid-community/styles/ag-theme-balham.css"; // Optional Theme applied to the grid

export function TableSchemasDisplay() {
  return (
    // wrapping container with theme & size
    <div
      className="ag-theme-balham-auto-dark"
      style={{ height: 200 }} // the grid will fill the size of the parent container
    >
      <AgGridReact
        rowData={[
          { selected: false, name: "user", numberOfRows: "100" },
          { selected: false, name: "org", numberOfRows: "50" },
          { selected: false, name: "user_data", numberOfRows: "200" },
          { selected: false, name: "user_phone_numbers", numberOfRows: "175" },
        ]}
        columnDefs={[
          { field: "selected" },
          { field: "name" },
          { field: "numberOfRows", headerName: "Number of Rows" },
        ]}
      />
    </div>
  );
}
