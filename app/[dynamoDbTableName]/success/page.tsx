import React from "react";
import { fetchTableData } from "./actions/fetch-table-data";

export default async function Success() {
  const data = await fetchTableData("postgres");

  console.log(data);

  // Extracting all unique keys for table headers from the data
  const allKeys = data.reduce((keys, item) => {
    Object.keys(item).forEach((key) => {
      if (!keys.includes(key)) keys.push(key);
    });
    return keys;
  }, [] as string[]);

  return (
    <main className="flex justify-center items-center h-[100vh] bg-blue-500">
      <section className="flex flex-col p-4 rounded-lg shadow-lg bg-blue-700 items-center" style={{ maxWidth: '1250px', width: '100%' }}>
        <h1 className="text-md text-white font-bold">DynamoDB Records</h1>
        <div className="overflow-auto" style={{ maxHeight: '700px', width: '1250px' }}>
          <table className="w-full text-white text-xs">
            <thead>
              <tr>
                {allKeys.map((key) => (
                  <th key={key} className="px-2 py-1 bg-blue-700" style={{ position: 'sticky', top: 0, minWidth: '100px', maxWidth: '150px' }}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index}>
                  {allKeys.map((key) => (
                    <td key={key} className="border px-2 py-1">
                      {row[key] ? JSON.stringify(row[key]) : "N/A"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export function createSuccessPageUrl(tableName: string) {
  return `/${tableName}/success/`;
}
