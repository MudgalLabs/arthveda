import { Button, TextInput, Link } from "@/s8ly";

export default function Signin() {
  return (
    <main className="flex h-screen flex-col items-center justify-center">
      <h1 className="font-poppins mb-8 text-[32px]">Sign in to Arthveda</h1>
      <form className="flex flex-col">
        <TextInput className="mb-4" placeholder="Username" />
        <TextInput className="mb-3" placeholder="Password" />

        <Link className="mb-8" href="/forgot-password">
          Forgot password?
        </Link>

        <Button className="mb-4" variant="secondary">
          Sign in
        </Button>
      </form>

      <p className="text-sm">
        No account?{" "}
        <Link className="text-sm" href="/sign-up">
          Sign up
        </Link>{" "}
        or continue with <Link className="text-sm">Google</Link>
      </p>
    </main>
  );
}
