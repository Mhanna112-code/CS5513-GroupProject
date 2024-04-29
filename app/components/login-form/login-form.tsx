"use client";
import { TextInput } from "@/components/TextInput";
import { loginAction } from "./login-action";
import { useRouter } from "next/navigation";
import { buildTableListPageUrl } from "@/app/table/[databaseIdentifier]/page";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <form
      action={async (data) => {
        const res = await loginAction(data);

        console.log("Action res", res);

        if (!res.success) {
          setErrorMessage(res.reason);
          return;
        }

        router.push(
          buildTableListPageUrl({
            databaseIdentifier: res.databaseIdentifier,
            password: res.password,
          })
        );
      }}
      className="flex flex-col gap-4"
    >
      {errorMessage ? (
        <p className="rounded-md px-4 py-2 bg-red-500 border-red-800 text-white">
          {errorMessage}
        </p>
      ) : null}
      <TextInput
        id="databaseIdentifier"
        name="databaseIdentifier"
        label="Database Identifier"
        required
      />
      <TextInput
        id="password"
        name="password"
        label="Password"
        type="password"
        required
      />
      <footer className="flex w-full px-4 py-2 dark:bg-slate-500 rounded-md">
        <button
          className="w-full rounded-sm"
          type="submit"
          onClick={() => {
            setErrorMessage(null);
          }}
        >
          Sign In
        </button>
      </footer>
    </form>
  );
}
