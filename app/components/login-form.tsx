"use client";

import { TextInput } from "@/components/TextInput";
import { useFormState } from "react-dom";

export function LoginForm() {
  const [state, action] = useFormState(
    async (values) => {
      console.log(values);
      return values;
    },
    { username: undefined }
  );

  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-lg bg-slate-800 p-4 w-80"
    >
      <header className="text-start">
        <h1>Connect to Database</h1>
      </header>
      <TextInput
        id="username"
        name="username"
        label="Username"
        placeholder="user"
        required
      />
      <TextInput id="password" name="password" label="Password" required />
      <TextInput id="host" name="host" label="Host" />
      <TextInput id="port" name="port" label="Port" placeholder="5432" />
      <TextInput id="database" name="database" label="Database" />
      <footer className="flex w-full px-4 py-2 dark:bg-slate-500 rounded-md">
        <button className="w-full rounded-sm" type="submit">
          Sign In
        </button>
      </footer>
    </form>
  );
}
