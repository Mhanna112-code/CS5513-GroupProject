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
    <main className="flex justify-center items-center h-[100vh]">
      <section className="flex flex-col p-8 rounded-md bg-slate-700 items-center max-w-[80%] gap-2">
        <h1 className="text-lg text-white">First 10 DynamoDB Records</h1>
        {/* Dynamic table generation based on data */}
        <div className="overflow-auto">
          <table className="w-full text-white">
            <thead>
              <tr>
                {allKeys.map((key) => (
                  <th key={key} className="px-4 py-2">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index}>
                  {allKeys.map((key) => (
                    <td key={key} className="border px-4 py-2">
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
