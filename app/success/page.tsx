import { IoMdCheckmark } from "react-icons/io";

export default function Success() {
  return (
    <main className="flex justify-center h-[100vh] items-center">
      <section className="flex flex-col p-8 rounded-md bg-slate-700 items-center max-w-[25%] gap-2">
        <IoMdCheckmark className="w-12 h-12 text-green-600" />
        <h1 className="text-lg">Migration Successful!</h1>
        <p className="text-slate-400">
          Your migration is complete! Click{" "}
          <a href="#" className="underline">
            here
          </a>{" "}
          to view your new table!
        </p>
      </section>
    </main>
  );
}
