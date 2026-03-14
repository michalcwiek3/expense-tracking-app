import { signIn, auth } from "../../auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="max-w-md mx-auto p-6 mt-16">
      <h1 className="text-2xl font-bold mb-4">Expense Tracker</h1>
      <p className="mb-6 text-sm text-gray-600">
        Sign in with your Google account to continue.
      </p>

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="px-4 py-3 rounded-lg bg-black text-white font-semibold"
        >
          Continue with Google
        </button>
      </form>
    </main>
  );
}
