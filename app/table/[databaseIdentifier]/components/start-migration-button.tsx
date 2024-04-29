"use client";
import { useState } from "react";

export function StartMigrationButton({
  onClick,
}: {
  onClick?: () => Promise<unknown>;
}) {
  // State to control the disabled status of the button
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDisabled = isSubmitting;

  return (
    <button
      className={
        "px-4 py-2 rounded-md text-gray-800 bg-white disabled:bg-gray-400 disabled:cursor-not-allowed"
      }
      disabled={isDisabled} // Button disabled based on state
      onClick={async () => {
        if (!onClick) return;

        setIsSubmitting(true); // Disable button when clicked

        await onClick().finally(() => setIsSubmitting(false));
      }}
    >
      {isSubmitting ? "Migrating..." : "Begin Migration"}
    </button>
  );
}
