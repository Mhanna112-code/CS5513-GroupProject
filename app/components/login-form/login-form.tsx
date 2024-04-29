"use client";
import { TextInput } from "@/components/TextInput";
import { loginAction } from "./login-action";
import { LoginFormErrorSection } from "./error-section";
import { useRouter } from "next/navigation";
import { buildTableListPageUrl } from "@/app/table/[databaseName]/page";

export function LoginForm() {
  const router = useRouter();

  return (
    <form
      action={async (data) => {
        const res = await loginAction(data);

        console.log("Action res", res);

        if (res.success) {
          router.push(
            buildTableListPageUrl({
              user: res.user,
              password: res.password,
              host: res.host,
              port: res.port,
              databaseName: res.tableName,
            })
          );
        }
      }}
      className="flex flex-col gap-4"
    >
      <LoginFormErrorSection />
      <TextInput
        id="user"
        name="user"
        label="Username"
        placeholder="user"
        required
      />
      <TextInput
        id="password"
        name="password"
        label="Password"
        type="password"
        required
      />
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
