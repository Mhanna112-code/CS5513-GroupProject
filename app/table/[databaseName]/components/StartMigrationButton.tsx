"use client";
import { useState } from 'react';
import { runDatabaseMigration } from "../actions/migrate-database/run-migration";

export function StartMigrationButton({
  databaseIdentifier,
  databasePassword,
  tableNames,
}: {
  databaseIdentifier: string;
  databasePassword: string;
  tableNames: [string, ...string[]];
}) {
  // State to control the disabled status of the button
  const [isDisabled, setIsDisabled] = useState(false);

  return (
    <button
      className={`px-4 py-2 rounded-md ${isDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-white'}`}
      disabled={isDisabled} // Button disabled based on state
      onClick={async () => {
        setIsDisabled(true); // Disable button when clicked
        try {
          await runDatabaseMigration({
            rdsDatabaseInfo: {
              identifier: databaseIdentifier,
              password: databasePassword,
            },
            tableNames,
          });
        } finally {
          setIsDisabled(false); // Re-enable button after operation completes
        }
      }}
    >
      Begin Migration
    </button>
  );
}
