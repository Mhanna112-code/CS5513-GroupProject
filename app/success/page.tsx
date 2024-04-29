"use client";
import React, { useState, useEffect } from 'react';

const Success = () => {
  // State to hold the fetched data
  const [data, setData] = useState([]);
  // State to hold the number of rows to display
  const [rowCount, setRowCount] = useState(10);

  // Simulating fetching data from a database
  useEffect(() => {
    const fetchData = async () => {
      // Here you would typically fetch data from a database
      const response = await fetch('path-to-your-api');
      const jsonData = await response.json();
      setData(jsonData);
    };

    fetchData();
  }, []);

  // Extracting all unique keys for table headers from the data
  const allKeys = data.reduce((keys, item) => {
    Object.keys(item).forEach(key => {
      if (!keys.includes(key)) keys.push(key);
    });
    return keys;
  }, []);

  return (
    <main className="flex justify-center items-center h-[100vh]">
      <section className="flex flex-col p-8 rounded-md bg-slate-700 items-center max-w-[80%] gap-2">
        <h1 className="text-lg text-white">Migration Results</h1>
        {/* Dropdown for selecting row count */}
        <select
          className="text-black mb-4"
          value={rowCount}
          onChange={(e) => setRowCount(Number(e.target.value))}
        >
          {[10, 20, 30, 40, 50].map((number) => (
            <option key={number} value={number}>
              Show {number} Rows
            </option>
          ))}
        </select>
        {/* Dynamic table generation based on data */}
        <div className="overflow-auto">
          <table className="w-full text-white">
            <thead>
              <tr>
                {allKeys.map((key) => (
                  <th key={key} className="px-4 py-2">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, rowCount).map((row, index) => (
                <tr key={index}>
                  {allKeys.map((key) => (
                    <td key={key} className="border px-4 py-2">{row[key] || 'N/A'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default Success;
