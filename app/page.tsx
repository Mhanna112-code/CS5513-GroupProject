import { LoginForm } from "./components/login-form/login-form";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <section className="flex flex-col gap-4 rounded-lg bg-slate-800 p-4 w-80">
        <header className="text-start">
          <h1>Connect to Database</h1>
        </header>
        <LoginForm />
      </section>
    </main>
  );
}
